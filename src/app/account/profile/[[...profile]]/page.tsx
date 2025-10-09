import { UserProfile } from '@clerk/nextjs'

const UserProfilePage = () => <UserProfile appearance={{ elements: { rootBox: "w-full h-full rounded-none", cardBox: "w-full h-full rounded-none border-0", scrollBox: "rounded-2xl" } }}/>

export default UserProfilePage