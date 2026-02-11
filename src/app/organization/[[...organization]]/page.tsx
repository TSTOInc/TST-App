import { OrganizationProfile } from '@clerk/nextjs'

const UserProfilePage = () => <OrganizationProfile appearance={
    { 
        elements: { 
            rootBox: "w-full h-full", 
            cardBox: "h-full rounded-t-none border-none max-w-[100vw] grid-cols-[calc(var(--clerk-spacing,_1rem)_*_14.25)_3fr]", 
            pageScrollBox: "bg-background", 
            navbar: "bg-sidebar",
            navbarMobileMenuRow: "bg-sidebar",
        } 
    }
} />

export default UserProfilePage