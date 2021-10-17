import { Component, HostListener, OnInit } from '@angular/core';
import io from 'socket.io-client';
import { environment } from 'src/environments/environment';
import * as $ from 'jquery'


@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.scss']
})
export class CustomerComponent implements OnInit {

  title = 'co-browsing-front';
  roomId = ""
  socket: any;
  userList: any[] = [];
  username: any = "";
  userData: any = {};
  isScrollLoaded = false;
  advisorId = "";

  constructor() { }

  ngOnInit(): void {
    // this.username = prompt('What is your name?', '');
    this.username = "Parth(Customer)";
    this.socket = io(`${environment.settings.apiProtocol}://${environment.settings.apiHost}`);
    this.userData = {
      name: this.username,
      joinTime: new Date().getTime(),
    }
    this.roomId = this.userData.name + "_" + this.userData.joinTime
    this.loadData();
  }

  loadData() {
    this.connectSocket();
    this.newAdvisorConnected();
    this.scrollChange();
    this.mouseChange();
    this.mouseClickedOnAdvisor();
    this.inputChange();
    this.setEvent();
    this.advisorDisconnected();
  }

  setEvent() {

    let changes = new MutationObserver((mutations: MutationRecord[]) => {
      let sendData: any[] = []
      mutations.map((event: any) => {
        let eventData = {
          id: event.target.id,
          type: event.type,
          element: document.getElementById(event.target.id)?.outerHTML
        }
        sendData.push(eventData)
      });
      this.socket.emit('sendChangedContent', { changedData: sendData, roomId: this.roomId, customerId: this.socket.id, advisorId: this.advisorId, });
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

    $("#changeImg").click(function () {
      $("#computer2").toggle(0);
      $("#computer2b").toggle(0);
    });

    $("#flip").click(function () {
      $("#flipDiv").toggleClass("flex-row-reverse")
    });

    // Observe the change in any input field. suppose if master types anything in text field then it will also reflect in slave component
    //@ts-ignore
    document.addEventListener('input', (event: any) => {
      if (event.target.id) {
        //@ts-ignore
        this.sendInput(event);
      }
    });
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

  connectSocket() {
    // setTimeout(() => {
    this.socket.on('connect', () => {
      this.socket.emit('join', { roomId: this.roomId, customerId: this.socket.id, advisorId: this.advisorId, user: this.userData, isCustomer: true, isGetCustomerData: false, isAdvisorConnected: false });
    })
    // }, 1000);
  };

  newAdvisorConnected() {
    this.socket.on("newAdvisorConnected", (data: any) => {
      if (this.advisorId) {
        return;
      }
      this.advisorId = data.advisorId;
      //@ts-ignore
      const htmlData = document.getElementById("container-content")?.innerHTML
      this.socket.emit('sendContent', { html: htmlData, roomId: this.roomId, customerId: this.socket.id, advisorId: this.advisorId });
      setTimeout(() => {
        this.sendSize();
        this.sendScroll();
      }, 10);
    });
  }

  sendSize() {
    this.socket.emit("sendSize", { innerWidth: window.innerWidth, innerHeight: window.innerHeight, roomId: this.roomId, customerId: this.socket.id, advisorId: this.advisorId });
  }

  sendScroll() {
    if (this.isScrollLoaded) {
      return;
    }
    this.socket.emit("sendScroll", { scrollTop: document.documentElement.scrollTop, scrollLeft: document.documentElement.scrollLeft, roomId: this.roomId, customerId: this.socket.id, advisorId: this.advisorId })
  }

  scrollChange() {
    this.socket.on('scrollChange', (data: any) => {
      if (data.customerId != this.socket.id) {
        return;
      }
      this.isScrollLoaded = true;
      document.documentElement.scrollTo(data.scrollLeft, data.scrollTop);
      setTimeout(() => {
        this.isScrollLoaded = false;
      }, 100);
    });
  }

  sendMouseMove(event: any) {
    this.socket.emit("sendMouse", { roomId: this.roomId, customerId: this.socket.id, advisorId: this.advisorId, username: this.username, screenX: event.screenX, screenY: event.screenY, clientX: event.clientX, clientY: event.clientY, isCustomer: true })
  }

  mouseChange() {
    this.socket.on("mouseChange", (data: any) => {
      if (data.customerId != this.socket.id) {
        return;
      }
      this.addUserList(data);
    })
  }

  addUserList(data: any) {
    if (!data.advisorId) {
      return;
    }
    if (data.isCustomer == true) {
      return;
    }
    let index = this.userList.findIndex((user: any) => user.advisorId == data.advisorId)
    data.position = { top: document.documentElement.scrollTop + data.clientY + "px", left: document.documentElement.scrollLeft + data.clientX + "px" }
    if (index == -1) {
      this.userList.push(data)
    } else {
      this.userList[index] = data;
    }
  }

  removeUserList(data: any) {
    const index = this.userList.findIndex((user: any) => user.advisorId == data.advisorId)
    data.position = { top: data.clientY + "px", left: data.clientX + "px" }
    if (index > -1) {
      this.userList.splice(index, 1)
    }
  }

  sendInput(event: any) {
    const dataToSend: any = {
      roomId: this.roomId,
      customerId: this.socket.id,
      advisorId: this.advisorId,
      inputId: event.target.id,
      type: event.target.type
    };
    if (event.target.type == "text") {
      dataToSend.value = event.target.value;
    } else if (event.target.type == "checkbox" || event.target.type == "radio") {
      dataToSend.checked = event.target.checked;
    }
    this.socket.emit("sendInput", dataToSend);
  }

  inputChange() {
    this.socket.on('inputChange', (data: any) => {
      if (data.customerId != this.socket.id) {
        return;
      }
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

  mouseClickedOnAdvisor() {
    this.socket.on("mouseClicked", (data: any) => {
      if (data.customerId != this.socket.id) {
        return;
      }
      const inputId = data.inputId;
      const type = data.type;
      //@ts-ignore
      let element = document.getElementById(inputId);
      if (!element) return;

      element.click();
    })
  }

  advisorDisconnected() {
    this.socket.on('userDisconnected', (data: any) => {
      if (data.userId == this.advisorId) {
        this.advisorId = "";
      }
    });
  }

}
