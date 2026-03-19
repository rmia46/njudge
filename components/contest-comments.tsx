'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, MessageSquare, Reply, Send, User as UserIcon } from 'lucide-react'

export function ContestComments({ contestId }: { contestId: string }) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      fetchComments()
    }
    init()

    const channel = supabase
      .channel(`contest_comments_${contestId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'comments', filter: `contest_id=eq.${contestId}` }, 
        () => fetchComments()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [contestId])

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(cf_handle)')
      .eq('contest_id', contestId)
      .order('created_at', { ascending: true })
    
    setComments(data || [])
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setIsSubmitting(true)
    const { error } = await supabase
      .from('comments')
      .insert({
        contest_id: contestId,
        user_id: user.id,
        content: newComment,
        parent_id: replyTo?.id || null
      })

    if (!error) {
      setNewComment('')
      setReplyTo(null)
    }
    setIsSubmitting(false)
  }

  // Organize comments into threads
  const mainComments = comments.filter(c => !c.parent_id)
  const replies = comments.filter(c => c.parent_id)

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="inara-block bg-white border-2 border-inara-border">
        <CardHeader className="pb-3 border-b-2 border-inara-border bg-inara-muted/10">
          <CardTitle className="text-lg flex items-center gap-2 font-black text-inara-logic uppercase italic">
            <MessageSquare className="w-5 h-5 text-inara-primary" />
            Discussion
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {replyTo && (
              <div className="flex justify-between items-center bg-inara-primary/5 px-4 py-2 rounded-xl text-xs border-2 border-inara-primary/20">
                <span className="text-inara-logic font-bold italic">Replying to {replyTo.profiles?.cf_handle || 'Anonymous'}</span>
                <Button variant="ghost" size="xs" className="h-6 px-2 text-rose-600 hover:bg-rose-50" onClick={() => setReplyTo(null)}>Cancel</Button>
              </div>
            )}
            <Textarea 
              placeholder={user ? "Write a comment..." : "Login to join the discussion"} 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!user || isSubmitting}
              className="min-h-[120px] border-2 border-inara-border focus-visible:ring-inara-primary/20 font-medium"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!user || isSubmitting || !newComment.trim()}
                className="inara-btn inara-btn-primary h-12 px-8 font-black"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                POST COMMENT
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {mainComments.map(comment => (
          <div key={comment.id} className="space-y-4">
            <CommentItem 
              comment={comment} 
              onReply={() => setReplyTo(comment)} 
            />
            
            {/* Replies */}
            <div className="ml-10 space-y-4 border-l-4 border-inara-border/10 pl-6">
              {replies.filter(r => r.parent_id === comment.id).map(reply => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  isReply 
                />
              ))}
            </div>
          </div>
        ))}
        {mainComments.length === 0 && (
          <div className="text-center py-20 inara-block border-dashed border-4 border-inara-border/20 bg-transparent">
            <MessageSquare className="w-12 h-12 text-inara-logic/10 mx-auto mb-4" />
            <p className="text-inara-logic/40 font-bold italic">No comments yet. Start the conversation!</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CommentItem({ comment, onReply, isReply = false }: any) {
  return (
    <div className={cn(
      "p-6 rounded-2xl border-2 shadow-sm transition-all",
      isReply ? 'bg-inara-muted/5 border-inara-border/10 ml-2' : 'bg-white border-inara-border'
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-inara-logic/5 border-2 border-inara-border/20 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-inara-logic/30" />
          </div>
          <div>
            <div className="font-black text-sm text-inara-logic uppercase">
              {comment.profiles?.cf_handle || 'Anonymous'}
            </div>
            <div className="text-[10px] font-mono font-bold text-inara-logic/30 uppercase mt-0.5">
              {new Date(comment.created_at).toLocaleString()}
            </div>
          </div>
        </div>
        {!isReply && onReply && (
          <Button variant="ghost" size="sm" className="h-9 px-4 text-xs font-black text-inara-logic/40 hover:text-inara-primary hover:bg-inara-primary/5 border-2 border-transparent hover:border-inara-primary/20 rounded-xl transition-all" onClick={onReply}>
            <Reply className="w-4 h-4 mr-2" /> REPLY
          </Button>
        )}
      </div>
      <p className="text-inara-logic/80 text-sm font-medium whitespace-pre-wrap leading-relaxed pl-1">
        {comment.content}
      </p>
    </div>
  )
}
