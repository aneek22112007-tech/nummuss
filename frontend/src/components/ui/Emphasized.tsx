type Props = {
  text: string
  emphasis: string
}

/** Body copy where one phrase is picked out in the accent colour. */
export function Emphasized({ text, emphasis }: Props) {
  const index = text.indexOf(emphasis)
  if (index === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <em className="font-semibold not-italic text-mint">{emphasis}</em>
      {text.slice(index + emphasis.length)}
    </>
  )
}
