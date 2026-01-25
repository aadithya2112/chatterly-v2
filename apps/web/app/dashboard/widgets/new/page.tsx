'use client'

import { useAuth } from "@clerk/nextjs"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

export default function NewWidgetPage() {
  const { getToken } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    systemPrompt: 'You are a helpful AI assistant for my website visitors.',
    allowedDomains: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()
      
      // Parse domains
      const domains = formData.allowedDomains
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0)

      const res = await fetchWithAuth('/widgets', token, {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          systemPrompt: formData.systemPrompt,
          allowedDomains: domains
        })
      })

      router.push(`/dashboard/widgets/${res.widget.id}`)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Widget</CardTitle>
          <CardDescription>Configure your AI assistant.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Widget Name</Label>
              <Input 
                id="name" 
                placeholder="My Website Chatbot" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea 
                id="systemPrompt" 
                placeholder="Instructions for how the AI should behave..." 
                className="min-h-[150px]"
                value={formData.systemPrompt}
                onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                required
              />
              <p className="text-xs text-muted-foreground">Define the personality and constraints of your AI.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowedDomains">Allowed Domains (Optional)</Label>
              <Input 
                id="allowedDomains" 
                placeholder="https://example.com, https://app.example.com" 
                value={formData.allowedDomains}
                onChange={e => setFormData({...formData, allowedDomains: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Comma-separated list of domains where this widget can be embedded.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
             <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Widget
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
