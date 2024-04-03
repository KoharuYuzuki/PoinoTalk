import { z } from 'zod'

export const isFirefox = () => CSS.supports('-moz-transform', 'none')

export const checkType = <T>(schema: z.ZodType<T>) => schema

export const uuid = () => crypto.randomUUID()

export const now = () => Date.now()

export const sum = (x: number[]) => x.reduce((sum, value) => sum + value, 0)

export function dispatchEvent (type: string, detail?: any) {
  const event = new CustomEvent(type, { detail: detail })
  window.dispatchEvent(event)
}

export function decorationSynthConfigNumber (number: number) {
  const rounded = Math.round(number * 10) / 10
  return `${rounded}.0`.slice(0, 3).replace(new RegExp('\\.$'), '')
}

export function decorationAccent (accent: 'high' | 'low') {
  return (accent === 'high') ? 'High' : 'Low'
}

export function decorationLengths (numbers: number[]) {
  const number = sum(numbers)
  const rounded = Math.round(number * 100) / 100
  return `${rounded}.0`.slice(0, 4).replace(new RegExp('\\.$'), '')
}

export function downloadFile (fileName: string, url: string) {
  const a = document.createElement('a')
  a.download = fileName
  a.href = url
  a.click()
  a.remove()
}

export function readFile (file: File, mode: 'text' | 'arrayBuffer') {
  return new Promise<string | ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()

    reader.addEventListener('load', () => {
      if (reader.result === null) {
        reject('reader result is null')
        return
      }

      resolve(reader.result)
    }, { once: true })

    reader.addEventListener('error', () => {
      reject(reader.error)
    }, { once: true })

    if (mode === 'text') {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}
