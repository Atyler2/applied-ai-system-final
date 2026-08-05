const Bubble = ({ message }: { message: { content: string; role: string; id?: string } }) => {
  const { content, role } = message
  return <div className={`${role} bubble`}>{content}</div>
}

export default Bubble