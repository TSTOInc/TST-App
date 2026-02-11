import { OrganizationProfile } from '@clerk/nextjs'

const UserProfilePage = () => <OrganizationProfile appearance={
    { 
        elements: { 
            rootBox: "w-full h-full", 
            cardBox: "w-full h-full rounded-t-none border-none max-w-[100vw] grid-cols-[calc(var(--clerk-spacing,_1rem)_*_14.25)_1fr] bg-red-500", 
            pageScrollBox: "bg-background rounded-none", 
            scrollBox: "rounded-none",
            navbar: "bg-sidebar",
            navbarMobileMenuRow: "bg-sidebar",
        } 
    }
} />

export default UserProfilePage