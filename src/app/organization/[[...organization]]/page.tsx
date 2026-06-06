import { OrganizationProfile } from '@clerk/nextjs'

const UserProfilePage = () => <OrganizationProfile appearance={
    { 
        elements: { 
            rootBox: "w-full h-full", 
            cardBox: "w-full h-full rounded-t-none border-none max-w-[100vw] grid-cols-1", 
            pageScrollBox: "bg-background rounded-none", 
            scrollBox: "rounded-none",
            navbar: "bg-sidebar !hidden",
            navbarMobileMenuRow: "bg-sidebar",
        } 
    }
} />

export default UserProfilePage