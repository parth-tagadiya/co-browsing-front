import { Component, HostListener, OnInit } from '@angular/core';
import io from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-slave',
  templateUrl: './slave.component.html',
  styleUrls: ['./slave.component.scss'],
})
export class SlaveComponent implements OnInit {
  socket: any;
  roomId = 'test';
  userList: any[] = [];
  username: any = '';

  constructor() { }

  ngOnInit(): void {
    this.socket = io(
      `${environment.settings.apiProtocol}://${environment.settings.apiHost}`
    );
    this.loadData();
    this.username = prompt('What is your name?', '');
  }

  loadData() {
    // On start, make socket connection and setup necessary socket events.
    this.connectSocket();
    this.getData();
    this.sizeChange();
    this.scrollChange();
    this.inputChange();
    this.mouseChange();
    this.disconnectUser();
  }

  connectSocket() {
    // Join to given roomId.
    this.socket.emit('join', {
      roomId: this.roomId,
      isMaster: false,
      username: this.username,
    });
  }

  sendMouseMove(event: any) {
    // Whenever user changes mouse, send that data to all other users.
    // @ts-ignore
    const iframe = document.getElementById('container');
    // @ts-ignore
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    this.socket.emit('sendMouse', {
      roomId: this.roomId,
      userId: this.socket.id,
      username: this.username,
      clientX: iframeDoc.body.scrollLeft + event.clientX,
      clientY: iframeDoc.body.scrollTop + event.clientY,
    });
  }

  getData() {
    this.socket.on('getContent', (data: any) => {
      // Get the html data and setup it in iframe.
      if (data.userId == this.socket.id || data.isSendAll) {
        // Get iframe and insert html.
        // @ts-ignore
        const iframe = document.getElementById('container');
        // @ts-ignore
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.body.innerHTML = data.html;

        // Insesrt css element into the iframe.
        const cssLink = document.createElement('link');
        cssLink.href = '../../../styles.css';
        cssLink.rel = 'stylesheet';
        cssLink.type = 'text/css';
        iframeDoc.head.appendChild(cssLink);

        // Setup mouse move listener in iframe.
        iframeDoc.body.addEventListener('mousemove', (event: any) => {
          this.sendMouseMove(event);
        });
      }
    });
  }

  // Whenever master's window size change. update slave's iframe size acording to that.
  sizeChange() {
    this.socket.on('sizeChange', (data: any) => {
      //@ts-ignore
      document.getElementById('container')?.width = data.innerWidth;
      //@ts-ignore
      document.getElementById('container')?.height = data.innerHeight;
    });
  }

  // Whenever master changes their scroll position. update slave's sccroll position.
  scrollChange() {
    this.socket.on('scrollChange', (data: any) => {
      //@ts-ignore
      const iframe = document.getElementById('container');
      //@ts-ignore
      iframe.contentWindow.scrollTo(0, data.scroll);
    });
  }

  // If master inputs field changes, update the same in slave's component.
  inputChange() {
    this.socket.on('inputChange', (data: any) => {
      const inputId = data.inputId;
      const type = data.type;

      const iframe = document.getElementById('container');
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

  // Mouse related events.
  // Whenever some another user moves mouse. render mouse positoin according to that.
  mouseChange() {
    this.socket.on('mouseChange', (data: any) => {
      this.addUserList(data);
    });
  }
  // If some user diconnects remove that user from list and render the mouse cursors.
  disconnectUser() {
    this.socket.on('userDisconnected', (data: any) => {
      this.removeUserList(data);
    });
  }
  // Add or updated other user's mouse position data.
  addUserList(data: any) {
    if (!data.userId) {
      return;
    }
    let index = this.userList.findIndex(
      (user: any) => user.userId == data.userId
    );
    data.position = { top: data.clientY + 'px', left: data.clientX + 'px' };
    if (index == -1) {
      this.userList.push(data);
    } else {
      this.userList[index] = data;
    }
  }
  // Remove other user's mouse position data.
  removeUserList(data: any) {
    let index = this.userList.findIndex(
      (user: any) => user.userId == data.userId
    );
    if (index > -1) {
      this.userList.splice(index, 1);
    }
  }
}
