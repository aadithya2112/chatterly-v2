import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to <span className="text-blue-600">Chatterly</span>
        </h1>

        <p className="mt-3 text-2xl">
          Embeddable AI Chat Widgets for your website.
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <Link href="/dashboard">
            <Button size="lg" className="mt-8 text-xl px-8 py-6">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}