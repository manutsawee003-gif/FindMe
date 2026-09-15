export type Location = { latitude: number; longitude: number; accuracy: number | null; updatedAt: number };
export type User = { id: string; displayName: string; photoURL?: string; familyId?: string };
export type Member = User & { status: 'safe' | 'emergency'; isSharing: boolean; location: Location | null; emergency: Emergency | null };
export type Emergency = { id: string; userId: string; type: string; message: string; people: number; location: Location; status: 'pending' | 'cancelled' | 'resolved'; createdAt: number };
export type Snapshot = { user: User; family: { id: string; name: string; ownerId: string } | null; members: Member[]; emergency: Emergency | null };
export type PublicEmergency = { id: string; type: string; location: Location; createdAt: number; people: number };
