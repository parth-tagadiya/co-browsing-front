import { Component, HostListener, OnInit } from '@angular/core';
import io from 'socket.io-client';

@Component({
  selector: 'app-master',
  templateUrl: './master.component.html',
  styleUrls: ['./master.component.scss']
})
export class MasterComponent implements OnInit {

  title = 'co-browsing-front';
  socket: any;

  ngOnInit(): void {
    this.socket = io("http://192.168.1.6:5000");
    this.getFrameData();
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

    this.connectSocket();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    console.log(window.innerWidth, window.outerWidth, window.innerHeight, window.outerHeight);
    this.socket.emit("sendSize", { innerWidth: window.innerWidth, innerHeight: window.innerHeight, room: "test" })
  }

  @HostListener('window:scroll', ['$event'])
  scrollHandler(event: any) {
    console.log("Scroll Event", document.documentElement.scrollTop);
    this.socket.emit("sendScroll", { scroll: document.documentElement.scrollTop, room: "test" })
  }

  getFrameData() {
    setInterval(() => {
      //@ts-ignore
      let data = document.getElementById("container")?.innerHTML
      this.socket.emit('sendContent', { html: data, room: "test" });
      this.socket.emit("sendSize", { innerWidth: window.innerWidth, innerHeight: window.innerHeight, room: "test" })
    }, 1000);
    //@ts-ignore
    // document.getElementById("content").innerHTML = data;
  }

  connectSocket() {
    this.socket.emit('join', { rooms: "test" });

  };

}
