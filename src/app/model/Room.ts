export interface Room {
    id: number;
    name: string;
    building: string;
    floor: string;
    status:  'Available' | 'Occupied' | 'Maintenance'; 
}