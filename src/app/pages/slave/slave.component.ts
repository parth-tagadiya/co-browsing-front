import { Component, OnInit } from '@angular/core';
import io from "socket.io-client";

@Component({
  selector: 'app-slave',
  templateUrl: './slave.component.html',
  styleUrls: ['./slave.component.scss']
})
export class SlaveComponent implements OnInit {
  socket: any;
  constructor() { }

  ngOnInit(): void {
    this.socket = io("http://192.168.1.6:5000");
    this.connectSocket()
    this.getData();
    this.scrollChange();
    this.sizeChange();
  }

  connectSocket() {
    this.socket.emit('join', { rooms: "test" });
  };

  getData() {
    this.socket.on("getContent", (data: any) => {
      //@ts-ignore
      document.getElementById("container").innerHTML = data.html;
    })
  }

  scrollChange() {
    this.socket.on("scrollChange", (data: any) => {
      //@ts-ignore
      document.documentElement.scroll({ top: data.scroll, behavior: 'smooth' })
    });
  }

  sizeChange() {
    this.socket.on("sizeChange", (data: any) => {
      //@ts-ignore
      document.getElementById("container")?.style.width = data.innerWidth
      //@ts-ignore
      document.getElementById("container")?.style.height = data.innerHeight
    });
  }

}
