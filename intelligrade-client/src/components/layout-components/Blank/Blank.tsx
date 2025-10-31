import { type BlankProps } from './interface'

export function Blank({ lines }: BlankProps) {
    return (
        <div
            style={{ height: `${lines}em` }}
            className="w-full"
            aria-hidden="true"
        />
    )
} 