'use client'

import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Eraser } from 'lucide-react'

interface SignaturePadProps {
    onEnd?: () => void
    onBegin?: () => void
}

export interface SignaturePadRef {
    isEmpty: () => boolean
    toDataURL: () => string
    clear: () => void
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
    ({ onEnd, onBegin }, ref) => {
        const sigPad = useRef<SignatureCanvas>(null)
        const [isEmpty, setIsEmpty] = useState(true)

        useImperativeHandle(ref, () => ({
            isEmpty: () => sigPad.current?.isEmpty() ?? true,
            toDataURL: () => sigPad.current?.toDataURL() ?? '',
            clear: () => {
                sigPad.current?.clear()
                setIsEmpty(true)
            },
        }))

        const handleEnd = () => {
            setIsEmpty(sigPad.current?.isEmpty() ?? true)
            onEnd?.()
        }

        const clear = () => {
            sigPad.current?.clear()
            setIsEmpty(true)
        }

        const containerRef = useRef<HTMLDivElement>(null)
        const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

        useEffect(() => {
            const element = containerRef.current
            if (!element) return

            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { width } = entry.contentRect
                    if (width > 0) {
                        setCanvasSize({ width, height: 200 })
                    }
                }
            })

            resizeObserver.observe(element)
            return () => resizeObserver.disconnect()
        }, [])

        return (
            <div className="flex flex-col gap-2" ref={containerRef}>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl overflow-hidden bg-background relative" style={{ height: 200 }}>
                    {canvasSize.width > 0 && (
                        <SignatureCanvas
                            ref={sigPad}
                            penColor="black"
                            canvasProps={{
                                width: canvasSize.width,
                                height: canvasSize.height,
                                className: 'cursor-crosshair',
                            }}
                            onEnd={handleEnd}
                            onBegin={onBegin}
                        />
                    )}
                </div>
                <div className="flex justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clear}
                        className="text-muted-foreground hover:text-foreground"
                        disabled={isEmpty}
                    >
                        <Eraser className="mr-2 h-4 w-4" />
                        Limpiar Firma
                    </Button>
                </div>
            </div>
        )

    }
)

SignaturePad.displayName = 'SignaturePad'
