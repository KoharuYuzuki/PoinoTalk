import { defineComponent, createApp } from 'vue'
import './vue-flag'
import { isFirefox, dispatchEvent } from './utils'
import Alert from './components/alert'
import type { AlertInstance } from './components/alert'
import Storage from './components/storage'
import type { StorageInstance } from './components/storage'
import Title from './components/title'
import Menu from './components/menu'
import EngineInitDialog from './components/engine-init-dialog'
import type { EngineInitDialogInstance } from './components/engine-init-dialog'
import LicenseConfirmer from './components/license-confirmer'
import Projects from './components/projects'
import Editor from './components/editor'
import DictList from './components/dict-list'
import PresetList from './components/preset-list'
import Settings from './components/settings'
import Help from './components/help'
import KeyboardShortcuts from './components/keyboard-shortcuts'
import BodySizeChecker from './components/body-size-checker'

const component = defineComponent({
  data(): {
    alert: AlertInstance | null
    storage: StorageInstance | null
    worker: Worker
  } {
    return {
      alert: null,
      storage: null,
      worker: new Worker('./worker.js', { type: 'module' })
    }
  },
  methods: {
    loadSettings() {
      this.storage?.loadSettings()
      .catch((e) => {
        console.error(e)

        this.alert?.display([
          '設定の読み込みに失敗しました',
          'ページを再読み込みしてください',
          '繰り返し表示される場合は設定データが破損している可能性があります',
          String(e)
        ])
      })
      .finally(() => dispatchEvent('settings:loaded'))
    },
    openEngineInitDialog() {
      const engineInitDialog = this.$refs.engineInitDialog as EngineInitDialogInstance
      engineInitDialog.open()
    },
    closeEngineInitDialog() {
      const engineInitDialog = this.$refs.engineInitDialog as EngineInitDialogInstance
      engineInitDialog.close()
    },
    startDialogEscapeBlocker() {
      window.addEventListener('keydown', (event) => {
        if (event.code !== 'Escape') return

        if (document.querySelectorAll('dialog[open]').length > 0) {
          event.preventDefault()
        }
      })
    }
  },
  mounted() {
    if (isFirefox()) {
      document.body.classList.add('is-firefox')
    }

    this.alert = this.$refs.alert as AlertInstance
    this.storage = this.$refs.storage as StorageInstance

    window.addEventListener('engine:ready', () => {
      this.closeEngineInitDialog()
    }, { once: true })

    this.startDialogEscapeBlocker()
    this.openEngineInitDialog()
    this.loadSettings()
  },
  render() {
    return (
      <>
        <Alert ref="alert"></Alert>
        <Storage ref="storage" alert={ this.alert }></Storage>
        <Title storage={ this.storage }></Title>
        <Menu storage={ this.storage }></Menu>
        <EngineInitDialog ref="engineInitDialog"></EngineInitDialog>
        <LicenseConfirmer storage={ this.storage }></LicenseConfirmer>
        <Projects alert={ this.alert } storage={ this.storage }></Projects>
        <Editor alert={ this.alert } storage={ this.storage } worker={ this.worker }></Editor>
        <DictList storage={ this.storage }></DictList>
        <PresetList storage={ this.storage }></PresetList>
        <Settings storage={ this.storage }></Settings>
        <Help></Help>
        <KeyboardShortcuts storage={ this.storage }></KeyboardShortcuts>
        <BodySizeChecker></BodySizeChecker>
      </>
    )
  }
})

const app = createApp(component)
app.mount('#app')
