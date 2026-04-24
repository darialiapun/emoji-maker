"use client"
console.log("ЛОГИ РАБОТАЮТ!");
import * as React from "react"
import {
  Show,
  SignInButton,
  UserButton,
  useAuth,
  useClerk,
} from "@clerk/nextjs"
import { Download, Heart, Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type EmojiItem = {
  id: string
  prompt: string
  imageUrl: string
  userId: string
  createdAt: string
  likesCount: number
  likedByMe: boolean
}

function EmojiTile({
  item,
  onLike,
  disabled,
}: {
  item: EmojiItem
  onLike: (id: string) => void
  disabled?: boolean
}) {
  const [imgLoaded, setImgLoaded] = React.useState(false)

  function download() {
    const url = `/api/download?url=${encodeURIComponent(item.imageUrl)}`
    const a = document.createElement("a")
    a.href = url
    a.download = "emoji.png"
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-800 dark:bg-neutral-900",
      )}
    >
      {!imgLoaded && (
        <div
          className="absolute inset-0 animate-pulse bg-neutral-200/80 dark:bg-neutral-800"
          aria-hidden
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- remote Replicate URLs */}
      <img
        src={item.imageUrl}
        alt={item.prompt}
        className={cn(
          "h-full w-full object-cover transition duration-300",
          imgLoaded ? "opacity-100" : "opacity-0",
        )}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
        <div className="flex items-center gap-2 p-3">
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            className="bg-white/95 text-neutral-900 shadow-sm hover:bg-white dark:bg-neutral-950 dark:text-neutral-100"
            onClick={(e) => {
              e.stopPropagation()
              download()
            }}
            aria-label="Download emoji"
          >
            <Download className="size-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              disabled={disabled}
              className={cn(
                "bg-white/95 shadow-sm hover:bg-white dark:bg-neutral-950",
                item.likedByMe
                  ? "text-red-500 hover:text-red-600"
                  : "text-neutral-900 dark:text-neutral-100",
              )}
              onClick={(e) => {
                e.stopPropagation()
                onLike(item.id)
              }}
              aria-label={item.likedByMe ? "Unlike" : "Like"}
            >
              <Heart
                className={cn("size-4", item.likedByMe && "fill-current")}
              />
            </Button>
            {item.likesCount > 0 && (
              <span className="min-w-[1.25rem] rounded-md bg-black/35 px-1.5 py-0.5 text-center text-xs font-medium text-white tabular-nums">
                {item.likesCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl border border-neutral-200/80 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-neutral-200/90 via-neutral-100 to-neutral-200/70 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800" />
        </div>
      ))}
    </div>
  )
}

export function EmojiMaker() {
  const { isSignedIn } = useAuth()
  const { openSignIn } = useClerk()
  const [items, setItems] = React.useState<EmojiItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [banner, setBanner] = React.useState<string | null>(null)
  const [prompt, setPrompt] = React.useState("")
  const [generating, setGenerating] = React.useState(false)
  const [likeBusy, setLikeBusy] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setBanner(null)
    try {
      const res = await fetch("/api/emojis")
      const data = (await res.json()) as {
        items?: EmojiItem[]
        error?: string
      }

      if (!res.ok) {
        setItems(data.items ?? [])
        setBanner(
          data.error ??
            "Could not load the gallery. Check Supabase configuration.",
        )
        return
      }

      setItems(data.items ?? [])
      if (res.status === 503) {
        setBanner(
          "Gallery database is not configured. Add Supabase environment variables.",
        )
      }
    } catch {
      setBanner("Network error while loading emojis.")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault()
    const p = prompt.trim()
    if (!p || generating) {
      return
    }

    setGenerating(true)
    setBanner(null)
    try {
      const res = await fetch("/api/create-emoji", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      })
      const data = (await res.json()) as { item?: EmojiItem; error?: string }

      if (!res.ok) {
        setBanner(data.error ?? "Generation failed.")
        return
      }

      if (data.item) {
        setItems((prev) => [data.item!, ...prev])
        setPrompt("")
      }
    } catch {
      setBanner("Network error during generation.")
    } finally {
      setGenerating(false)
    }
  }

  async function onLike(id: string) {
    if (!isSignedIn) {
      void openSignIn({})
      return
    }

    setLikeBusy(id)
    try {
      const res = await fetch(`/api/emojis/${id}/like`, { method: "POST" })
      const data = (await res.json()) as {
        liked?: boolean
        likesCount?: number
        error?: string
      }

      if (!res.ok) {
        setBanner(data.error ?? "Could not update like.")
        return
      }

      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                likedByMe: !!data.liked,
                likesCount: data.likesCount ?? it.likesCount,
              }
            : it,
        ),
      )
    } catch {
      setBanner("Network error while liking.")
    } finally {
      setLikeBusy(null)
    }
  }

  const showEmptyState = !loading && items.length === 0 && !generating
  const showFirstGenOverlay =
    !loading && items.length === 0 && generating
  const showGalleryGrid =
    !loading && (items.length > 0 || generating) && !showFirstGenOverlay

  return (
    <div className="min-h-svh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="text-3xl leading-none" aria-hidden>
              🥺
            </span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Emoji maker
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="rounded-lg">
                  Sign in
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "size-9",
                  },
                }}
              />
            </Show>
          </div>
        </header>

        {banner && (
          <div
            className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
            role="status"
          >
            {banner}
          </div>
        )}

        <form
          onSubmit={onGenerate}
          className="flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter a prompt to generate an emoji"
            disabled={generating}
            className="h-11 flex-1 rounded-xl border-neutral-300 bg-white text-base shadow-none dark:border-neutral-700 dark:bg-neutral-900"
            aria-label="Prompt"
          />
          <Show when="signed-in">
            <Button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="h-11 shrink-0 rounded-xl bg-neutral-900 px-8 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Generating
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button
                type="button"
                className="h-11 shrink-0 rounded-xl bg-neutral-900 px-8 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                Sign in to generate
              </Button>
            </SignInButton>
          </Show>
        </form>

        <section className="w-full space-y-4" aria-labelledby="gallery-heading">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="gallery-heading"
              className="text-sm font-medium text-neutral-500 dark:text-neutral-400"
            >
              All generated emojis
            </h2>
            {generating && (
              <span className="inline-flex items-center gap-1.5 text-xs text-neutral-500">
                <Sparkles className="size-3.5 animate-pulse" />
                Creating your emoji…
              </span>
            )}
          </div>

          {loading && <SkeletonGrid count={12} />}

          {showFirstGenOverlay && (
            <div className="relative">
              <SkeletonGrid count={12} />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/40 backdrop-blur-[1px] dark:bg-neutral-950/40">
                <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/95 px-4 py-2 text-sm font-medium shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                  <Loader2 className="size-4 animate-spin" />
                  Generating…
                </div>
              </div>
            </div>
          )}

          {showGalleryGrid && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {generating && (
                <div className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-violet-200/50 via-neutral-100 to-fuchsia-200/40 dark:from-violet-950/40 dark:via-neutral-900 dark:to-fuchsia-950/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-10 animate-spin text-neutral-400" />
                  </div>
                </div>
              )}
              {items.map((item) => (
                <EmojiTile
                  key={item.id}
                  item={item}
                  onLike={onLike}
                  disabled={likeBusy === item.id}
                />
              ))}
            </div>
          )}

          {showEmptyState && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 py-16 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
                <Sparkles className="size-7 text-neutral-400" />
              </div>
              <p className="max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
                No emojis yet. Sign in and describe an emoji to fill this grid
                with playful 3D-style icons.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
