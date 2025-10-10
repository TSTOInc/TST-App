import { OrganizationProfile } from '@clerk/nextjs'

const UserProfilePage = () => <OrganizationProfile appearance={{ elements: { rootBox: "w-full h-full rounded-none", cardBox: "w-full h-full rounded-none border-0", scrollBox: "rounded-2xl w-full" } }}/>

export default UserProfilePage