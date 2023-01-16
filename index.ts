import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.set('view engine', 'ejs');
// json使えるようにする
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

type User = {
  id: string;
  name: string;
  roomId: string;
}

type Room = {
  id: string;
  users: User[];
  comments: string[];
}

const roomList: Room[] = []; // Mapつかってidで一意にするかRedis使って保存するとよさそう
const userList: User[] = []; // mapこれもsockidから一意にするのがよさそう

app.get("/", (req, res) => {
  res.render("top", {
    title: 'あひ'
  });
});

app.get("/list", (req, res) => {
  return res.json(roomList)
})

const generateRoomId = () => {
  return 'abcd'
}


io.on("connection", (socket) => {
  socket.on("create", (data) => {
    const roomId = generateRoomId();
    // ユーザーの作成
    const user: User = {
      id: socket.id,
      name: data.userName,
      roomId
    }
    // 部屋の作成
    const room: Room = {
      id: roomId,
      users: [user],
      comments: []
    }

    // Roomに追加
    roomList.push(room);
    userList.push(user);
    socket.join(roomId);

    console.log(room)
    console.log(user)

    io.to(socket.id).emit("updateRoom", room);
  })

  socket.on("enter", (data) => {
    const roomIndex = roomList.findIndex((r) => r.id == data.roomId);
    if (roomIndex == -1) {
      io.to(socket.id).emit("notifyError", "部屋が見つかりません");
      return;
    }
    // ユーザーの作成
    const user: User = { id: socket.id, name: data.userName, roomId: data.roomId };
    userList.push(user);
    roomList[roomIndex].users.push(user);
    socket.join(data.roomId);
    io.to(data.roomId).emit("updateRoom", roomList[roomIndex]);
  });

  socket.on("comment", (data) => {
    const roomId = data.roomId;
    const room = roomList.find(v => v.id === roomId);
    // room?.comments.unshift(data.comment);
    io.in(roomId).emit("comment", data.comment);
  })

  socket.on("disconnect", (data) => {
    const user = userList.find(v => v.id === socket.id)
    if (!user) return;
    const room = roomList.find(v => v.id === user.roomId)
    if (!room) return;
    io.to(room.id).emit("leave", "まるまるさんがぬけたよ")
    // TODO: room.usersから削除
    io.to(room.id).emit("updateRoom", room);
  })
});

httpServer.listen(3000);