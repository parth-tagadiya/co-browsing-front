import { Component, HostListener, OnInit } from '@angular/core';
import io from "socket.io-client";

@Component({
  selector: 'app-slave',
  templateUrl: './slave.component.html',
  styleUrls: ['./slave.component.scss']
})
export class SlaveComponent implements OnInit {
  socket: any;
  roomId = "test"
  userList: any[] = [];
  username: any = "";
  constructor() { }

  ngOnInit(): void {
    this.socket = io("http://192.168.1.5:5000");
    this.loadData();

    this.username = prompt('What is your name?', '');
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: any) {
    this.sendMouseMove(event)
  }

  loadData() {
    this.connectSocket()
    this.getData();
    this.scrollChange();
    this.sizeChange();
    this.mouseChange();
    this.disconnectUser();
  }

  connectSocket() {
    this.socket.emit('join', { roomId: this.roomId, isMaster: false, username: this.username });
  };

  getData() {
    this.socket.on("getContent", (data: any) => {
      if (data.userId == this.socket.id) {
        // @ts-ignore
        let iframe = document.getElementById('container');
        // @ts-ignore
        let iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        // document.getElementById("container").innerHTML = data.html;
        // //@ts-ignore
        iframeDoc.body.innerHTML = data.html
        const cssLink = document.createElement("link");
        cssLink.href = "../../../styles.css";
        cssLink.rel = "stylesheet";
        cssLink.type = "text/css";
        iframeDoc.head.appendChild(cssLink);
      }
    })
  }

  scrollChange() {
    this.socket.on("scrollChange", (data: any) => {
      //@ts-ignore
      let iframe = document.getElementById('container');
      //@ts-ignore
      iframe.contentWindow.scrollTo(0, data.scroll);
      // document.documentElement.scroll({ top: data.scroll, behavior: 'smooth' })
    });
  }

  sizeChange() {
    this.socket.on("sizeChange", (data: any) => {
      //@ts-ignore
      document.getElementById("container")?.width = data.innerWidth
      // document.getElementById("container")?.style.width = data.innerWidth + "px"
      //@ts-ignore
      document.getElementById("container")?.height = data.innerHeight
      // document.getElementById("container")?.style.height = data.innerHeight + "px"
    });
  }

  sendMouseMove(event: any) {
    this.socket.emit("sendMouse", { userId: this.socket.id, username: this.username, screenX: event.screenX, screenY: event.screenY, clientX: event.clientX, clientY: event.clientY, roomId: this.roomId })
  }

  mouseChange() {
    this.socket.on("mouseChange", (data: any) => {
      this.addUserList(data);
    })
  }

  disconnectUser() {
    this.socket.on("userDisconnected", (data: any) => {
      this.removeUserList(data);
    })
  }

  removeUserList(data: any) {
    let index = this.userList.findIndex((user: any) => user.userId == data.userId)
    data.position = { top: data.clientY + "px", left: data.clientX + "px" }
    if (index > -1) {
      this.userList.splice(index, 1)
    }
  }

  addUserList(data: any) {
    if (!data.userId) {
      return;
    }
    let index = this.userList.findIndex((user: any) => user.userId == data.userId);
    data.position = { top: data.clientY + "px", left: data.clientX + "px" }
    if (index == -1) {
      this.userList.push(data)
    } else {
      this.userList[index] = data;
    }
  }
}
