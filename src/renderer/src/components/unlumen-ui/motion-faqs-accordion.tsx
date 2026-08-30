'use client'

import * as React from 'react'
import { motion } from 'motion/react'

import { cn } from '@/lib/utils'

export interface MotionAccordionItem {
  question: React.ReactNode
  answer: React.ReactNode
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  itemId,
  panelId
}: {
  item: MotionAccordionItem
  isOpen: boolean
  onToggle: () => void
  itemId: string
  panelId: string
}) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [contentH, setContentH] = React.useState(0)

  React.useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setContentH(el.scrollHeight))
    ro.observe(el)
    setContentH(el.scrollHeight)
    return () => ro.disconnect()
  }, [])

  return (
    <motion.div
      layout
      className={cn(
        'overflow-hidden rounded-xl bg-transparent text-white',
        isOpen ? 'bg-[#111111]' : 'hover:bg-white/5'
      )}
      transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.9 }}
      animate={{ scale: isOpen ? 1 : 0.985 }}
      initial={false}
      style={{ originX: 0.5, originY: 0 }}
    >
      <button
        id={itemId}
        type="button"
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full cursor-pointer select-none items-center justify-between gap-4 px-6 py-3 text-left"
      >
        <span className="text-[clamp(1.2rem,1.6vw,1.3rem)] font-medium tracking-tight leading-snug w-full">
          {item.question}
        </span>

        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{
            rotate: isOpen ? 180 : 0,
            scale: isOpen ? 1.05 : 1
          }}
          transition={{ type: 'spring', stiffness: 480, damping: 28 }}
          className="inline-flex w-6 h-6 shrink-0 items-center justify-center text-foreground"
        >
          {isOpen ? (
            <svg width="14" height="14" viewBox="0 0 14 2" fill="none" aria-hidden>
              <path d="M1 1h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M7 1v12M1 7h12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          )}
        </motion.span>
      </button>

      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={itemId}
        animate={{
          height: isOpen ? contentH : 0,
          opacity: isOpen ? 1 : 0
        }}
        initial={false}
        transition={{
          height: { type: 'spring', stiffness: 340, damping: 34, mass: 0.9 },
          opacity: { duration: 0.2, ease: 'easeOut' }
        }}
        style={{ overflow: 'hidden' }}
      >
        <motion.div
          ref={contentRef}
          animate={{ y: isOpen ? 0 : -8 }}
          transition={{
            type: 'spring',
            stiffness: 360,
            damping: 30,
            mass: 0.8
          }}
          className="px-4 pb-4"
        >
          <div className="text-foreground/75">{item.answer}</div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export interface MotionAccordionProps {
  items: MotionAccordionItem[]
  /** @default 10 */
  gap?: number
  className?: string
  value?: number | null
  onValueChange?: (value: number | null) => void
}

export function MotionAccordion({
  items,
  gap = 10,
  className,
  value,
  onValueChange
}: MotionAccordionProps) {
  const rawId = React.useId()
  const baseId = `accordion-${rawId.replace(/:/g, '')}`

  const [internalOpenIndex, setInternalOpenIndex] = React.useState<number | null>(null)

  const isControlled = value !== undefined
  const openIndex = isControlled ? value : internalOpenIndex

  const toggle = (i: number) => {
    const newValue = openIndex === i ? null : i
    if (!isControlled) {
      setInternalOpenIndex(newValue)
    }
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-col" style={{ gap }}>
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
            itemId={`${baseId}-trigger-${i}`}
            panelId={`${baseId}-panel-${i}`}
          />
        ))}
      </div>
    </div>
  )
}
