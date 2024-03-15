import { defineComponent } from 'vue'

const component = defineComponent({
  methods: {
    display(message: string | string[]) {
      if (Array.isArray(message)) {
        const joined = message.join('\n')
        alert(joined)
      } else {
        alert(message)
      }
    }
  },
  render() {
    return <></>
  }
})

export default component
export type AlertInstance = InstanceType<typeof component>
