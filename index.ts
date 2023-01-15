import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.set('view engine', 'ejs');
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

const roomList: any[] = [];
const userList: any[] = [];

app.get("/", (req, res) => {
  res.render("top", {
    title: 'あひ'
  });
});

const generateRoomId = () => {
  return 'abcd'
}

// 次のターンプレイヤーのindexを返却
function getNextTurnUserIndex(room: any) {
  return room.turnUserIndex == room.users.length - 1
    ? 0 // 現在のindexが末尾の場合、次を0としてターンプレイヤーをループする
    : room.turnUserIndex + 1;
}

io.on("connection", (socket) => {
  socket.on("create", async (data) => {
    const roomId = generateRoomId();
    const user = {
      id: socket.id,
      name: data.userName,
      roomId
    }
    const room = {
      id: roomId,
      users: [user],
      turnUserIndex: 0,
      posts: []
    }

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
    const user = { id: socket.id, name: data.userName, roomId: data.roomId };
    roomList[roomIndex].users.push(user);
    userList.push(user);
    socket.join(roomList[roomIndex].id);
    io.to(roomList[roomIndex].id).emit("updateRoom", roomList[roomIndex]);
  });
  // しりとりの単語を送信
  socket.on("post", (input) => {
    const user = userList.find((u) => u.id == socket.id);
    const roomIndex = roomList.findIndex((r) => r.id == user.roomId);
    const room = roomList[roomIndex];

    // ターンプレイヤーかチェック
    if (room.users[room.turnUserIndex].id != socket.id) {
      io.to(socket.id).emit("notifyError", "あなたのターンではありません");
      return;
    }
    // 正しい入力かチェック
    // if (!checkWord(input, room.posts)) {
    //   io.to(socket.id).emit(
    //     "notifyError",
    //     "入力が不正です。1つ前の単語の最後の文字から始まる単語を半角英字入力してください"
    //   );
    //   return;
    // }
    // 単語を保存
    roomList[roomIndex].posts.unshift({
      userName: user.name,
      word: input,
    });
    // ターンプレイヤーを次のユーザーに進める
    roomList[roomIndex].turnUserIndex = getNextTurnUserIndex(room);

    io.in(room.id).emit("updateRoom", room);
  });
  // socket.on("message", async (data) => {
  //   console.log(data.room)
  //   console.log(socket.rooms)
  //   const room = data.room;
  //   await socket.join(room)
  //   // emit(イベント名, データ)
  //   io.to(room).emit('hello', 'world')
  // })
});

httpServer.listen(3000);