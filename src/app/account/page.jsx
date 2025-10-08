import React from 'react'
import AccountClient from './accountClient'
import { auth0 } from "@/lib/auth0";

export default async function page() {

  const session = await auth0.getSession();
  return (
    <AccountClient session={session} />
  )
}