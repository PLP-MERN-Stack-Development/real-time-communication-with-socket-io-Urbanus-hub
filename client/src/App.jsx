import io from 'socket.io-client'

export default function  App(){
  const socket=io('http://localhost:3000')
  return(
    <div className="bg-black w-screen h-screen">Weclome to our prime chats </div>
  )
}