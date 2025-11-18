import React from 'react'

export default function ProfilePage() {
  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Profile management is temporarily unavailable.
        </p>
      </div>
      <div className="p-6 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Please check back later for profile management features.
        </p>
      </div>
    </div>
  )
} 