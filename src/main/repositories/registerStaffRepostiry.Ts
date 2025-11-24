import { StaffRepository } from "../repositories/StaffRepository";
import { ipcMain } from "electron";
import { ensureAdmin, ensureAuthenticated } from "../utils/session";


let registered = false;
export function registerStaffRepository(
    repositories: { staffRepository: StaffRepository },
   
): void {
    if (registered) {
        return;
    }
    registered = true;
}   