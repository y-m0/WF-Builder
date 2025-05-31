import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="font-bold">Workflow Builder</span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/">Editor</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/workflows/builder">WF Builder</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="container py-6">
        {children}
      </main>
    </div>
  )
}