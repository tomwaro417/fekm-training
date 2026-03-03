import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (className utilities)', () => {
  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class active-class')
  })

  it('should handle false conditional classes', () => {
    const isActive = false
    const result = cn('base-class', isActive && 'active-class')
    expect(result).toBe('base-class')
  })

  it('should merge multiple class objects', () => {
    const result = cn(
      'flex items-center',
      'justify-center',
      'bg-blue-500 hover:bg-blue-600'
    )
    expect(result).toBe('flex items-center justify-center bg-blue-500 hover:bg-blue-600')
  })

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, 'middle', null, 'end')
    expect(result).toBe('base middle end')
  })

  it('should handle empty strings', () => {
    const result = cn('', 'class1', '', 'class2', '')
    expect(result).toBe('class1 class2')
  })

  it('should resolve conflicting tailwind classes', () => {
    // tailwind-merge should resolve conflicts
    const result = cn('p-4', 'p-6', 'm-2', 'm-4')
    expect(result).toBe('p-6 m-4')
  })

  it('should handle array of classes', () => {
    const result = cn(['class1', 'class2'], 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('should handle nested arrays', () => {
    const result = cn(['class1', ['class2', 'class3']], 'class4')
    expect(result).toBe('class1 class2 class3 class4')
  })
})
