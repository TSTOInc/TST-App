"use client"

import React, { useEffect, useState } from "react"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  FieldGroup,
  FieldSet,
  FieldLabel,
  FieldDescription,
  FieldSeparator,
  Field,
  FieldLegend,
} from "@/components/ui/field"
import { User, BoxIcon, Bell, CreditCard } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function AccountClient({ session }) {
  const t_session = session || {
    name: "Test Name",
    nickname: "Test Nickname",
    email: "Test Email",
    picture: "https://placehold.co/600x400"
  };

  return (
    <div className="lg:px-24 lg:py-20 px-4 py-8">
      <div className="flex items-center justify-between lg:mb-16 mb-8">
        {/* Left column: text */}
        <div>
          <h1 className="scroll-m-20 text-5xl lg:text-6xl font-medium tracking-tight text-balance">
            Account
          </h1>
          <span className="text-muted-foreground text-sm lg:text-lg">
            Here you can view and manage your account details.
          </span>
        </div>

        {/* Right column: avatar */}
        <div className="flex-shrink-0">
          <Avatar className="h-32 w-32">
            <AvatarImage src={t_session.user.picture} />
            <AvatarFallback>
              {t_session.user.name?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <Tabs
        defaultValue="tab-1"
        orientation="vertical"
        className="w-full flex lg:flex-row"
      >
        <TabsList className="flex-row flex lg:hidden text-foreground gap-1 bg-transparent px-1 py-0 w-full">
          {[
            { label: "Profile", value: "tab-1", icon: User },
            { label: "Organization", value: "tab-2", icon: BoxIcon },
            { label: "Notifications", value: "tab-3", icon: Bell },
            { label: "Billing", value: "tab-4", icon: CreditCard },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="
             py-2 px-2 w-full flex flex-col items-center justify-center
    border-none bg-transparent shadow-none
    relative
    after:absolute after:inset-x-0 after:bottom-0 after:h-0.5
    data-[state=active]:after:bg-primary
    hover:bg-accent hover:text-foreground
            ">
              {tab.icon && <tab.icon />}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsList className="hidden lg:flex text-foreground flex-col gap-1 rounded-none bg-transparent px-1 py-0 h-full">
          {[
            { label: "Profile", value: "tab-1", icon: User },
            { label: "Organization", value: "tab-2", icon: BoxIcon },
            { label: "Notifications", value: "tab-3", icon: Bell },
            { label: "Billing", value: "tab-4", icon: CreditCard },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="
                py-2 px-4
                data-[state=active]:rounded-l-none
                border-none bg-transparent shadow-none
                data-[state=active]:bg-transparent hover:bg-accent hover:text-foreground
                data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent
                relative w-full justify-start after:absolute after:inset-y-0 after:start-0
                after:w-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none
              "
            >
              {tab.icon && <tab.icon className="mr-2" />}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grow rounded-md border text-start">
          <TabsContent value="tab-1">
            <div className="w-full p-8">
              <FieldGroup>
                <FieldLegend className="block lg:hidden">Profile Details</FieldLegend>
                <FieldSet>
                  <FieldLabel>Name</FieldLabel>
                  <FieldDescription>
                    This is your public display full name.
                  </FieldDescription>
                  <FieldGroup data-slot="checkbox-group">
                    <Field orientation="horizontal">
                      <Input id="name" placeholder="Full name" defaultValue={t_session.user.name} />
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <FieldSeparator />
                <FieldSet>
                  <FieldLabel>Username</FieldLabel>
                  <FieldDescription>
                    This is your username that you use to log in.
                  </FieldDescription>
                  <FieldGroup data-slot="checkbox-group">
                    <Field orientation="horizontal">
                      <Input id="username" placeholder="Username (e.g. john_doe)" defaultValue={t_session.user.nickname} />
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <FieldSeparator />
                <FieldSet>
                  <FieldLabel>Email</FieldLabel>
                  <FieldDescription>
                    This is your email address that you use to log in.
                  </FieldDescription>
                  <FieldGroup data-slot="checkbox-group">
                    <Field orientation="horizontal">
                      <Input id="email" placeholder="johndoe@example.com" defaultValue={t_session.user.email} />
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
            </div>
          </TabsContent>

          <TabsContent value="tab-2">
            <div className="w-full p-8">
              <FieldGroup>
                <FieldLegend className="block lg:hidden">Organization Details</FieldLegend>
                <p className="text-muted-foreground px-4 py-3 text-xs">Content for Tab 2</p>
              </FieldGroup>
            </div>
          </TabsContent>

          <TabsContent value="tab-3">
            <div className="w-full p-8">
              <FieldGroup>
                <FieldLegend className="block lg:hidden">Notifications</FieldLegend>
                <p className="text-muted-foreground px-4 py-3 text-xs">Content for Tab 3</p>
              </FieldGroup>
            </div>
          </TabsContent>

          <TabsContent value="tab-4">
            <div className="w-full p-8">
              <FieldGroup>
                <FieldLegend className="block lg:hidden">Billing Details</FieldLegend>
                <p className="text-muted-foreground px-4 py-3 text-xs">Content for Tab 4</p>
              </FieldGroup>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}