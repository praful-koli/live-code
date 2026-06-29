import roomService from './room.service.js'
import ApiResponse from '../../shared/utils/ApiResponse.js'

class RoomController {

   async createRoom(req, res) {
    const data = await roomService.createRoom(req.body);
    ApiResponse.created(data , 'Room created successfully').send(res)
   }
}

export default new RoomController();