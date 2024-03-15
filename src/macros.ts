export async function version () {
  const file = Bun.file('./package.json')
  const { version } = await file.json()
  if (version === undefined) return 'unknown'
  return `v${String(version)}`
}

export async function license () {
  const file = Bun.file('./LICENSE')
  const text = await file.text()
  return text
}

export async function thirdPartyNotices () {
  const file = Bun.file('./ThirdPartyNotices.txt')
  const text = await file.text()
  return text
}

export async function qa () {
  const file = Bun.file('./Q&A.txt')
  const text = await file.text()
  return text
}
