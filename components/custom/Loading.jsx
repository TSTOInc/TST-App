import React from 'react'

const Loading = () => {
  return (
    <main className="flex flex-col justify-center items-center h-screen text-center p-8">
        <h1 className="text-6xl lg:text-8xl font-bold mb-4">Loading...</h1>
        <p className="text-xl mb-8">Fetching data from server...</p>
    </main>
  )
}

export default Loading
