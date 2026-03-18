'use client'

import { useState, useRef, useEffect } from 'react'
import { Block } from '@/types'
import { cn } from '@/lib/utils'
import { debounce } from '@/lib/utils'
import { AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react'

interface CalloutBlockProps {
  block: Block
  editable: boolean
  onUpdate: (updates: Partial<Block>) => void
  isUpdating: boolean
}

const calloutTypes = {
  info: { icon: Info, color: 'blue', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'yellow', label: 'Warning' },
  error: { icon: AlertCircle, color: 'red', label: 'Error' },
  success: { icon: CheckCircle, color: 'green', label: 'Success' },
}

export function CalloutBlock({ block, editable, onUpdate, isUpdating }: CalloutBlockProps) {
  const [text, setText] = useState(block.content?.text || '')
  const [type, setType] = useState<keyof typeof calloutTypes>(block.content?.type || 'info')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const debouncedUpdate = debounce((newText: string, newType: keyof typeof calloutTypes) => {
    