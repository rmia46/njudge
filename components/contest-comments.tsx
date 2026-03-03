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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Discussion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            {replyTo && (
              <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded text-sm border-l-4 border-emerald-500">
                <span className="text-slate-600 italic">Replying to {replyTo.profiles?.cf_handle || 'Anonymous'}</span>
                <Button variant="ghost" size="xs" className="h-6 px-2" onClick={() => setReplyTo(null)}>Cancel</Button>
              </div>
            )}
            <Textarea 
              placeholder={user ? "Write a comment..." : "Login to join the discussion"} 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!user || isSubmitting}
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!user || isSubmitting || !newComment.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Post Comment
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
            <div className="ml-10 space-y-4 border-l-2 border-slate-100 pl-4">
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
          <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border-2 border-dashed">
            No comments yet. Start the conversation!
          </div>
        )}
      </div>
    </div>
  )
}

function CommentItem({ comment, onReply, isReply = false }: any) {
  return (
    <div className={`p-4 rounded-lg border bg-white shadow-sm ${isReply ? 'bg-slate-50/50' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <span className="font-bold text-sm text-emerald-800">
              {comment.profiles?.cf_handle || 'Anonymous'}
            </span>
            <span className="text-[10px] text-slate-400 ml-2">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
        </div>
        {!isReply && onReply && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={onReply}>
            <Reply className="w-3 h-3 mr-1" /> Reply
          </Button>
        )}
      </div>
      <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
        {comment.content}
      </p>
    </div>
  )
}
