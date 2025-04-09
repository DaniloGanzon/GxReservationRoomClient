// reservation.model.ts
import { Room } from "./Room";
export interface Reservation {
    id?: number;
    name: string;
    purpose: string;
    roomId: number;
    startDate: string;  // "YYYY-MM-DD"
    endDate: string;    // "YYYY-MM-DD"
    timeStart: string;  // "HH:mm:ss"
    timeDuration: string; // "HH:mm:ss" or number of hours
    userId?: string;
    status?: string;
    room?: Room;
}