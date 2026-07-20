import { useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { AnimatePresence, motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import {
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react"
import type { ConfigSection } from "../types"

interface ConfigurationTreeProps {
  config: ConfigSection[]
}

export function ConfigurationTree({ config }: ConfigurationTreeProps) {
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(config.map((s) => s.id))
  )
  const shouldReduce = useReducedMotion()

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filtered = config
    .map((section) => {
      if (!search) return section
      const q = search.toLowerCase()
      const matchingEntries = section.entries.filter(
        (e) =>
          e.key.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      )
      if (matchingEntries.length === 0 && !section.label.toLowerCase().includes(q)) {
        return null
      }
      return {
        ...section,
        entries: matchingEntries.length > 0 ? matchingEntries : section.entries,
      }
    })
    .filter(Boolean) as ConfigSection[]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search configuration keys..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">No matching configuration</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}

        {filtered.map((section) => {
          const isOpen = expanded.has(section.id)
          return (
            <Card key={section.id} className="overflow-hidden">
              <button
                onClick={() => toggle(section.id)}
                className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-semibold flex-1">
                  {section.label}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {section.entries.length} {section.entries.length === 1 ? "key" : "keys"}
                </Badge>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={shouldReduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={shouldReduce ? undefined : { height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/40">
                      {section.entries.map((entry, i) => (
                        <div
                          key={entry.key}
                          className={cn(
                            "flex items-start gap-3 px-4 py-2.5",
                            i % 2 === 0 ? "bg-muted/10" : "bg-transparent"
                          )}
                        >
                          <code className="text-xs font-mono text-primary/80 min-w-[160px] shrink-0 pt-0.5">
                            {entry.key}
                          </code>
                          <span className="text-xs text-foreground/80 flex-1 break-all">
                            {String(entry.value)}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 max-w-[200px] shrink-0 hidden sm:block">
                            {entry.description}
                          </span>
                          <Badge
                            variant={
                              entry.editable ? "default" : "neutral"
                            }
                            className="text-[10px] shrink-0"
                          >
                            {entry.editable ? "editable" : "read-only"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
