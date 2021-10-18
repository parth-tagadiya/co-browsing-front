import { Component, HostListener, OnInit } from '@angular/core';
import io from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-advisor',
  templateUrl: './advisor.component.html',
  styleUrls: ['./advisor.component.scss']
})
export class AdvisorComponent implements OnInit {

  socket: any;
  roomId = '';
  customerId = '';
  advisorRoomId = 'advisor';
  userList: any[] = [];
  username: any = '';
  isDataLoaded = false;
  isScrollLoaded = false;
  customerList: any = [];

  constructor() { }

  ngOnInit(): void {
    this.username = prompt('What is your name?', '');
    this.username += "(Advisor)"
    this.socket = io(`${environment.settings.apiProtocol}://${environment.settings.apiHost}`);
    this.loadData();
  }

  loadData() {
    // On start, make socket connection and setup necessary socket events.
    this.getAllCustomerList();
    this.newCustomerConnected();
    this.customerDisconnected();
    this.getData();
    this.sizeChange();
    this.scrollChange();
    this.mouseChange();
    this.inputChange();
    this.disconnectUser();
    this.getChangedContent();
  }

  getAllCustomerList() {
    this.socket.emit('join', { roomId: this.advisorRoomId, customerId: this.customerId, advisorId: this.socket.id, isCustomer: false, isNewAdvisor: true });
    this.socket.emit("advisorConnected", { isCustomer: false, customerId: this.customerId, advisorId: this.socket.id, });
    this.socket.on('sendCustomerList', (data: any) => {
      this.customerList = data.customers;
    });
  }

  newCustomerConnected() {
    this.socket.on('newCustomerAdded', (data: any) => {
      if (data.isCustomer) {
        this.customerList.push(data)
      }
    });
  }

  customerDisconnected() {
    this.socket.on('userDisconnected', (data: any) => {
      this.customerList = this.customerList.filter((customer: any) => {
        if (customer.customerId == data.userId) {
          return false;
        } else {
          return true;
        }
      })
      if (data.userId == this.customerId) {
        this.disconnectToRoom();
      }
    });
  }

  connectToRoom(roomId: any, customerId: any) {
    if (roomId) {
      this.roomId = roomId;
      this.customerId = customerId;
      let userData = {
        name: this.username,
        joinTime: new Date().getTime(),
      }
      this.socket.emit('join', { roomId: this.roomId, customerId: this.customerId, advisorId: this.socket.id, user: userData, isCustomer: false, isGetCustomerData: true })
      setTimeout(() => {
        this.iframeEvents();
      }, 10);
    }
  }

  getData() {
    this.socket.on('getContent', (data: any) => {
      this.isDataLoaded = true;
      if (data.advisorId == this.socket.id) {
        // @ts-ignore
        const iframe = document.getElementById('container-content');
        // @ts-ignore
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        //Set Bootstrap
        const bootstrapCss = document.createElement('link');
        bootstrapCss.href = 'https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css';
        bootstrapCss.rel = 'stylesheet';
        bootstrapCss.type = 'text/css';
        iframeDoc.head.appendChild(bootstrapCss);
        const bootstrapJquery = document.createElement('script');
        bootstrapJquery.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js';
        iframeDoc.head.appendChild(bootstrapJquery);
        const bootstrapPopper = document.createElement('script');
        bootstrapPopper.src = 'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.0/umd/popper.min.js';
        iframeDoc.head.appendChild(bootstrapJquery);
        const bootstrap = document.createElement('script');
        bootstrap.src = 'https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js';
        iframeDoc.head.appendChild(bootstrapJquery);

        iframeDoc.body.innerHTML = data.html;

        const cssLink = document.createElement('link');
        cssLink.href = '../../../styles.css';
        cssLink.rel = 'stylesheet';
        cssLink.type = 'text/css';
        iframeDoc.head.appendChild(cssLink);
      }
    });
  }

  getChangedContent() {
    this.socket.on('getChangedContent', (data: any) => {
      // Get the html data and setup it in iframe.
      if (data.advisorId == this.socket.id) {
        // Get iframe and insert html.
        // @ts-ignore
        const iframe = document.getElementById('container-content');
        // @ts-ignore
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

        for (let changedData of data.changedData) {
          if (changedData.id) {
            // @ts-ignore
            iframe.contentWindow.document.getElementById(changedData.id).outerHTML = changedData.element;
          }
        }
      }
    });

  }

  sizeChange() {
    this.socket.on('sizeChange', (data: any) => {
      if (data.advisorId != this.socket.id) {
        return;
      }
      //@ts-ignore
      document.getElementById('container-content')?.width = data.innerWidth;
      //@ts-ignore
      document.getElementById('container-content')?.height = data.innerHeight;
    });
  }

  sendScroll(event: any) {
    if (this.isScrollLoaded) {
      return;
    }
    // Send master's current scroll position. 
    this.socket.emit("sendScroll", { roomId: this.roomId, customerId: this.customerId, advisorId: this.socket.id, scrollTop: event.scrollTop, scrollLeft: event.scrollLeft })
  }

  scrollChange() {
    this.socket.on('scrollChange', (data: any) => {
      if (data.advisorId != this.socket.id) {
        return;
      }
      this.isScrollLoaded = true;
      //@ts-ignore
      const iframe = document.getElementById('container-content');
      //@ts-ignore
      iframe.contentWindow.scrollTo(data.scrollLeft, data.scrollTop);
      setTimeout(() => {
        this.isScrollLoaded = false;
      }, 100);
    });
  }

  mouseChange() {
    this.socket.on('mouseChange', (data: any) => {
      if (data.advisorId != this.socket.id) {
        return;
      }
      this.addUserList(data);
    });
  }

  sendMouseMove(event: any) {
    // Whenever user changes mouse, send that data to all other users.
    // @ts-ignore
    const iframe = document.getElementById('container-content');
    // @ts-ignore
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    this.socket.emit('sendMouse', {
      roomId: this.roomId,
      customerId: this.customerId,
      advisorId: this.socket.id,
      username: this.username,
      clientX: event.clientX,
      clientY: event.clientY,
      isCustomer: false
    });
  }

  addUserList(data: any) {
    if (!data.customerId) {
      return;
    }
    if (data.isCustomer == false) {
      return;
    }

    let index = this.userList.findIndex(
      (user: any) => user.customerId == data.customerId
    );
    data.position = { top: data.clientY + 'px', left: data.clientX + 'px' };
    if (index == -1) {
      this.userList.push(data);
    } else {
      this.userList[index] = data;
    }
  }

  removeUserList(data: any) {
    let index = this.userList.findIndex(
      (user: any) => user.customerId == data.customerId
    );
    if (index > -1) {
      this.userList.splice(index, 1);
    }
  }

  inputChange() {
    this.socket.on('inputChange', (data: any) => {
      if (data.advisorId != this.socket.id) {
        return;
      }
      const inputId = data.inputId;
      const type = data.type;
      const iframe = document.getElementById('container-content');
      if (!iframe) return;
      //@ts-ignore
      const element = iframe.contentWindow.document.getElementById(inputId);
      if (!element) return;

      if (type == "text") {
        element.value = data.value;
      } else if (type == "checkbox" || type == "radio") {
        element.checked = data.checked;
      }

    });
  }

  sendInput(event: any) {
    const dataToSend: any = {
      roomId: this.roomId,
      customerId: this.customerId,
      advisorId: this.socket.id,
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

  onMouseClick(event: any) {
    const dataToSend: any = {
      roomId: this.roomId,
      customerId: this.customerId,
      advisorId: this.socket.id,
      inputId: event.target.id,
      type: event.target.type,
    };
    this.socket.emit("sendMouseClick", dataToSend);
  }

  disconnectUser() {
    this.socket.on('userDisconnected', (data: any) => {
      this.removeUserList(data);
    });
  }

  disconnectToRoom() {
    alert("Customer leave the room")
    // this.socket.leave(this.roomId)
    this.socket.close();
    this.roomId = "";
    this.customerId = "";
    this.socket.connect();
  }

  iframeEvents() {
    // @ts-ignore
    const iframe = document.getElementById('container-content');
    // @ts-ignore
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow.document;
    //@ts-ignore
    iframeDoc?.body?.addEventListener('input', (event: any) => {
      if (event.target.id) {
        //@ts-ignore
        this.sendInput(event);
      }
    });

    //@ts-ignore
    iframeDoc?.addEventListener('scroll', (event: any) => {
      let data = {
        scrollTop: event.target.scrollingElement.scrollTop,
        scrollLeft: event.target.scrollingElement.scrollLeft
      }
      //@ts-ignore
      this.sendScroll(data);
    });

    iframeDoc.body.addEventListener('mousemove', (event: any) => {
      this.sendMouseMove(event);
    });

    iframeDoc.body.addEventListener('mouseup', (event: any) => {
      this.onMouseClick(event)
    });

  }
}
