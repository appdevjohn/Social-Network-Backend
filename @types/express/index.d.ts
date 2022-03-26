namespace Express {
    interface Request {
        userId?: string | null,
        activated?: boolean,
        adminGroupId: string | null,
        memberGroupId: string | null,
        ownerMessageId: string | null,
        ownerPostId: string | null
    }
}