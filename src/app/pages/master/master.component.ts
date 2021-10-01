import { Component, HostListener, OnInit } from '@angular/core';
import io from 'socket.io-client';

@Component({
  selector: 'app-master',
  templateUrl: './master.component.html',
  styleUrls: ['./master.component.scss']
})
export class MasterComponent implements OnInit {

  title = 'co-browsing-front';
  roomId = "test"
  socket: any;
  userList: any[] = [];
  username = "master";

  ngOnInit(): void {
    this.socket = io("http://192.168.1.5:5000");

    let element = document.querySelector("html");
    let changes = new MutationObserver((mutations: MutationRecord[]) => {
      // mutations.forEach((mutation: MutationRecord) => {
      // console.log(mutations);
      // });
    }
    );
    //@ts-ignore
    changes.observe(document.documentElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
      // attributeOldValue: true,
      // characterDataOldValue: true
    });

    this.loadData();
  }

  loadData() {
    this.connectSocket();
    // this.sendFrameData();
    this.newUserConnected();
    this.mouseChange();
    this.disconnectUser();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.sendSize();
  }

  @HostListener('window:scroll', ['$event'])
  scrollHandler(event: any) {
    this.sendScroll()
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: any) {
    this.sendMouseMove(event)
  }

  connectSocket() {
    this.socket.emit('join', { roomId: this.roomId, isMaster: true });
  };

  newUserConnected() {
    this.socket.on("userJoined", (data: any) => {
      //@ts-ignore
      let htmlData = document.getElementById("container")?.innerHTML
      this.socket.emit('sendContent', { html: htmlData, roomId: this.roomId, userId: data.userId });
      this.sendSize();
      this.sendScroll();
    });
  }

  // sendFrameData() {
  //   //@ts-ignore
  //   let htmlData = document.getElementById("container")?.innerHTML
  //   this.socket.emit('sendContent', { html: htmlData, roomId: this.roomId });
  //   this.socket.emit("sendSize", { innerWidth: window.innerWidth, innerHeight: window.innerHeight, roomId: "test" });
  // }

  sendSize() {
    this.socket.emit("sendSize", { innerWidth: window.innerWidth, innerHeight: window.innerHeight, roomId: this.roomId });
  }

  sendScroll() {
    this.socket.emit("sendScroll", { scroll: document.documentElement.scrollTop, roomId: this.roomId })
  }

  sendMouseMove(event: any) {
    this.socket.emit("sendMouse", { userId: this.socket.id, username: this.username, screenX: event.screenX, screenY: event.screenY, clientX: event.clientX, clientY: event.clientY, roomId: this.roomId })
  }

  mouseChange() {
    this.socket.on("mouseChange", (data: any) => {
      this.addUserList(data);
    })
  }

  addUserList(data: any) {
    if (!data.userId) {
      return;
    }
    let index = this.userList.findIndex((user: any) => user.userId == data.userId)
    data.position = { top: data.clientY + "px", left: data.clientX + "px" }
    if (index == -1) {
      this.userList.push(data)
    } else {
      this.userList[index] = data;
    }
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

}
