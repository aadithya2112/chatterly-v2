'use.client'
'use client'

import { useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchWithAuth } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Plus, MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface Widget {
  id: string
  name: string
  enabled: boolean
  createdAt: string
  allowedDomains: string[]
}

export default function DashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadWidgets() {
      if (!isLoaded || !isSignedIn) return
      
      try {
        const token = await getToken()
        const data = await fetchWithAuth('/widgets', token)
        setWidgets(data.widgets)
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadWidgets()
  }, [isLoaded, isSignedIn, getToken])

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <Skeleton className="h-48" />
           <Skeleton className="h-48" />
           <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Your Widgets</h1>
        <Link href="/dashboard/widgets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Widget
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {widgets.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium">No widgets yet</h3>
          <p className="text-muted-foreground mb-4">Create your first AI chat widget to get started.</p>
          <Link href="/dashboard/widgets/new">
            <Button variant="outline">Create Widget</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <Link key={widget.id} href={`/dashboard/widgets/${widget.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{widget.name}</CardTitle>
                  <CardDescription>
                    {widget.allowedDomains.length > 0 
                      ? `${widget.allowedDomains.length} allowed domains` 
                      : 'No domain restrictions'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="text-sm text-muted-foreground">
                  Created {new Date(widget.createdAt).toLocaleDateString()}
                  {widget.enabled ? (
                    <span className="ml-auto inline-flex items-center text-green-500 font-medium text-xs bg-green-500/10 px-2 py-1 rounded-full">
                      Active
                    </span>
                  ) : (
                     <span className="ml-auto inline-flex items-center text-muted-foreground font-medium text-xs bg-muted px-2 py-1 rounded-full">
                      Disabled
                    </span>
                  )}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
