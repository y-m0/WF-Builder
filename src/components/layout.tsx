import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { GitBranch, Book, Bell, Settings } from "lucide-react"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 hidden md:flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <span className="hidden font-bold text-gradient sm:inline-block">Orchestra Nexus</span>
            </a>
            <nav className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground/90">
                Workflows
              </Button>
              <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground/90">
                Templates
              </Button>
              <Button variant="ghost" size="sm" className="text-foreground/70 hover:text-foreground/90">
                Monitoring
              </Button>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground/90">
                <GitBranch className="h-5 w-5" />
                <span className="sr-only">Version Control</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground/90">
                <Book className="h-5 w-5" />
                <span className="sr-only">Documentation</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground/90">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Notifications</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground/90">
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>
      <main className="container max-w-screen-2xl py-6">
        {children}
      </main>
    </div>
  )
}