'use client'

import { useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchWithAuth } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Copy, RefreshCw, Trash2, Save, Loader2, Check } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface Widget {
  id: string
  name: string
  systemPrompt: string
  publicApiKey: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  allowedDomains: string[]
}

export default function WidgetDetailPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [widget, setWidget] = useState<Widget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    systemPrompt: '',
    allowedDomains: ''
  })

  useEffect(() => {
    async function loadWidget() {
      if (!isLoaded || !isSignedIn || !params?.id) return
      
      try {
        const token = await getToken()
        const data = await fetchWithAuth(`/widgets/${params.id}`, token)
        setWidget(data.widget)
        setFormData({
          name: data.widget.name,
          systemPrompt: data.widget.systemPrompt,
          allowedDomains: data.widget.allowedDomains.join(', ')
        })
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadWidget()
  }, [isLoaded, isSignedIn, params?.id, getToken])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const token = await getToken()
      const domains = formData.allowedDomains
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0)

      const data = await fetchWithAuth(`/widgets/${params?.id}`, token, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          systemPrompt: formData.systemPrompt,
          allowedDomains: domains
        })
      })
      
      setWidget(data.widget)
      // Show success toast ideally
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this widget? This action cannot be undone.")) return

    try {
      const token = await getToken()
      await fetchWithAuth(`/widgets/${params?.id}`, token, {
        method: 'DELETE'
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRegenerateKey = async () => {
    if (!confirm("Regenerating the key will break any existing instances of this widget using the old key. Continue?")) return
    
    try {
        const token = await getToken()
        const data = await fetchWithAuth(`/widgets/${params?.id}/regenerate-key`, token, {
            method: 'POST'
        })
        setWidget(w => w ? { ...w, publicApiKey: data.apiKey } : null)
    } catch (err: any) {
        setError(err.message)
    }
  }

  const copyEmbedCode = () => {
    const code = `<script src="https://cdn.example.com/widget.js" data-widget-id="${widget?.id}" data-public-key="${widget?.publicApiKey}"></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isLoaded || loading) {
     return <div className="container mx-auto py-10"><Skeleton className="h-96" /></div>
  }

  if (!widget) return <div className="container mx-auto py-10">Widget not found</div>

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Widget
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Update your widget settings.</CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdate}>
                <CardContent className="space-y-4">
                    {error && <div className="text-destructive text-sm">{error}</div>}
                    
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input 
                            id="name" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="systemPrompt">System Prompt</Label>
                        <Textarea 
                            id="systemPrompt" 
                            value={formData.systemPrompt} 
                            onChange={e => setFormData({...formData, systemPrompt: e.target.value})} 
                            className="min-h-[200px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="allowedDomains">Allowed Domains</Label>
                        <Input 
                            id="allowedDomains" 
                            value={formData.allowedDomains} 
                            onChange={e => setFormData({...formData, allowedDomains: e.target.value})} 
                        />
                        <p className="text-xs text-muted-foreground">Comma separated.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-2 h-4 w-4" /> Save Changes
                    </Button>
                </CardFooter>
                </form>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Integration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Public API Key</Label>
                        <div className="flex items-center mt-1">
                            <code className="bg-muted p-2 rounded text-xs flex-1 overflow-auto whitespace-nowrap">
                                {widget.publicApiKey}
                            </code>
                            <Button variant="ghost" size="icon" onClick={() => {
                                navigator.clipboard.writeText(widget.publicApiKey)
                            }}>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleRegenerateKey}>
                            <RefreshCw className="mr-2 h-3 w-3" /> Regenerate Key
                        </Button>
                    </div>

                    <div>
                        <Label className="text-xs font-semibold uppercase text-muted-foreground">Embed Code</Label>
                        <div className="mt-1 relative">
                            <pre className="bg-slate-950 text-slate-50 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">
                                {`<script src="https://cdn.example.com/widget.js" \n data-widget-id="${widget.id}" \n data-public-key="${widget.publicApiKey}"></script>`}
                            </pre>
                            <Button size="icon" variant="ghost" className="absolute top-1 right-1 text-white hover:text-white hover:bg-white/20" onClick={copyEmbedCode}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <span>Active</span>
                        <Badge variant={widget.enabled ? "default" : "destructive"}>
                            {widget.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
