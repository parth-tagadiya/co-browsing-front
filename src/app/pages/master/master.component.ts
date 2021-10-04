import { Component, HostListener, OnInit } from '@angular/core';
import io from 'socket.io-client';
import { environment } from 'src/environments/environment';
import * as $ from 'jquery'

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
    this.socket = io(`${environment.settings.apiProtocol}://${environment.settings.apiHost}`);
    this.loadData();
  }

  loadData() {


    let changes = new MutationObserver((mutations: MutationRecord[]) => {
      //@ts-ignore
      let htmlData = document.getElementById("container-content")?.innerHTML
      this.socket.emit('sendContent', { html: htmlData, roomId: this.roomId, isSendAll: true });
    }
    );
    //@ts-ignore
    changes.observe(document.getElementById("container-content"), {
      // changes.observe(document.documentElement, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
      // attributeOldValue: true,
      // characterDataOldValue: true
    });

    // Observe the change in any input field. suppose if master types anything in text field then it will also reflect in slave component
    //@ts-ignore
    document.addEventListener('input', (event: any) => {
      if (event.target.id) {
        //@ts-ignore
        this.sendInput(event);
      }
    });

    this.connectSocket();
    this.newUserConnected();
    this.mouseChange();
    this.disconnectUser();
    this.inputChange();
    this.mouseClickedOnSlave();

    this.flipBtn()
  }

  flipBtn() {
    $("#changeImg").click(function () {
      $("#computer2").toggle(0);
      $("#computer2b").toggle(0);
    })

    $("#flip").click(function () {
      $("#flipDiv").toggleClass("flex-row-reverse")
    })
  }

  // Setting up event listeners for various events like mouse move, window size change, etc..
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

  // Connect to socket using given roomId.
  connectSocket() {
    this.socket.emit('join', { roomId: this.roomId, isMaster: true });
  };

  newUserConnected() {
    // Whenever new user joins, we need to send current page to that user.
    // Also send necessary details like window size and scroll position.
    this.socket.on("userJoined", (data: any) => {
      //@ts-ignore
      const htmlData = document.getElementById("container-content")?.innerHTML
      this.socket.emit('sendContent', { html: htmlData, roomId: this.roomId, userId: data.userId, isSendAll: false });
      this.sendSize();
      this.sendScroll();
    });
  }

  sendSize() {
    // Send master's window size to slave component. It will be reflected in slave component.
    this.socket.emit("sendSize", { innerWidth: window.innerWidth, innerHeight: window.innerHeight, roomId: this.roomId });
  }

  sendScroll() {
    // Send master's current scroll position. 
    this.socket.emit("sendScroll", { scrollTop: document.documentElement.scrollTop, scrollLeft: document.documentElement.scrollLeft, roomId: this.roomId })
  }

  sendMouseMove(event: any) {
    // Here we are sending mouse position to other users.
    // Here "event.ClientX" will give position of cursor with respect to current window's top left position. We need to also consider the scroll position to get proper mouse position.
    this.socket.emit("sendMouse", { userId: this.socket.id, username: this.username, screenX: event.screenX, screenY: event.screenY, clientX: event.clientX, clientY: event.clientY, isMaster: true, roomId: this.roomId })
    // this.socket.emit("sendMouse", { userId: this.socket.id, username: this.username, screenX: event.screenX, screenY: event.screenY, clientX: event.clientX, clientY: event.clientY, roomId: this.roomId })
  }

  // Whenever any uother user moves their mouse, this method will be called.
  // We will add/update mouse postion of that user and render it.
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

  // Whenever any user leaves current room. this method will be called and that user's mouse cursor will be removed from list and render.
  disconnectUser() {
    this.socket.on("userDisconnected", (data: any) => {
      this.removeUserList(data);
    })
  }
  removeUserList(data: any) {
    const index = this.userList.findIndex((user: any) => user.userId == data.userId)
    data.position = { top: data.clientY + "px", left: data.clientX + "px" }
    if (index > -1) {
      this.userList.splice(index, 1)
    }
  }

  // On input change, send input field details to other user(slave).
  sendInput(event: any) {
    const dataToSend: any = {
      roomId: this.roomId,
      inputId: event.target.id,
      type: event.target.type,
    };
    if (event.target.type == "text") {
      dataToSend.value = event.target.value;
    } else if (event.target.type == "checkbox" || event.target.type == "radio") {
      dataToSend.checked = event.target.checked;
    }
    this.socket.emit("sendInput", dataToSend);
  }

  // If master inputs field changes, update the same in slave's component.
  inputChange() {
    this.socket.on('inputChange', (data: any) => {
      const inputId = data.inputId;
      const type = data.type;

      //@ts-ignore
      let element = document.getElementById(inputId);
      if (!element) return;

      if (type == "text") {
        //@ts-ignore
        element.value = data.value;
      } else if (type == "checkbox" || type == "radio") {
        //@ts-ignore
        element.checked = data.checked;
      }

    });
  }

  mouseClickedOnSlave() {
    this.socket.on("mouseClicked", (data: any) => {
      const inputId = data.inputId;
      const type = data.type;
      //@ts-ignore
      let element = document.getElementById(inputId);
      if (!element) return;

      element.click();
    })
  }

}
