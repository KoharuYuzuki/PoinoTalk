import { defineComponent } from 'vue'
import type { PropType } from 'vue'
import type { StorageInstance, KeyboardShortcuts } from './storage'
import { dispatchEvent } from '../utils'

export default defineComponent({
  data(): {
    keyboardShortcuts: KeyboardShortcuts
  } {
    return {
      keyboardShortcuts: {}
    }
  },
  props: {
    storage: {
      type: [Object, null] as PropType<StorageInstance | null>,
      required: true
    }
  },
  watch: {
    'storage.settings.keyboardShortcuts': {
      handler() {
        if (this.storage === null) return
        this.keyboardShortcuts = this.storage.settings.keyboardShortcuts
      },
      deep: true
    }
  },
  mounted() {
    window.addEventListener('keydown', (event) => {
      const filtered =
        Object.keys(this.keyboardShortcuts)
        .filter((key) => this.keyboardShortcuts[key].code === event.code)

      filtered.forEach((key) => {
        const shortcut = this.keyboardShortcuts[key]

        const CtrlOrMeta = event.ctrlKey || event.metaKey
        const alt        = event.altKey
        const shift      = event.shiftKey

        if (
          (CtrlOrMeta === false) ||
          (alt !== shortcut.alt) ||
          (shift !== shortcut.shift)
        ) return

        event.preventDefault()

        if (document.querySelectorAll('dialog[open]').length <= 0) {
          console.log(`shortcut:${key}`)
          dispatchEvent(`shortcut:${key}`)
        }
      })
    })
  },
  render() {
    return <></>
  }
})
