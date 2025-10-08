import React from 'react'
import AccountClient from './accountClient'

export default async function page() {
  const t_session = {
    user: {
      name: "Real Name",
      nickname: "Real Nickname",
      email: "Real Email",
      picture: "https://placehold.co/600x400"
    }
  };
  return (
    <AccountClient session={t_session} />
  )
}