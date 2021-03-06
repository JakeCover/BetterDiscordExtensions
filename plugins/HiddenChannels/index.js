module.exports = (Plugin, Library) => {

  const {
    Logger,
    DiscordModules,
    WebpackModules,
    DiscordAPI,
    Utilities,
    DiscordSelectors,
    DCM,
    PluginUtilities,
    DiscordClasses,
    DOMTools,
    Patcher
  } = Library;
  const React = DiscordModules.React;
  const escapeHTML = DOMTools.escapeHTML ? DOMTools.escapeHTML : function (html) {
    const textNode = document.createTextNode("");
    const spanElement = document.createElement("span");
    spanElement.append(textNode);
    textNode.nodeValue = html;
    return spanElement.innerHTML;
  };

  return class HiddenChannels extends Plugin {
    constructor() {
      super();
      this.requestOptions = {};

      //<editor-fold desc="css">
      this.css = `

/* Modal */

@keyframes permissions-backdrop {
    to { opacity: 0.85; }
}

@keyframes permissions-modal-wrapper {
    to { transform: scale(1); opacity: 1; }
}

@keyframes permissions-backdrop-closing {
    to { opacity: 0; }
}

@keyframes permissions-modal-wrapper-closing {
    to { transform: scale(0.7); opacity: 0; }
}

#permissions-modal-wrapper .callout-backdrop {
    animation: permissions-backdrop 250ms ease;
    animation-fill-mode: forwards;
    opacity: 0;
    background-color: rgb(0, 0, 0);
    transform: translateZ(0px);
}

#permissions-modal-wrapper.closing .callout-backdrop {
    animation: permissions-backdrop-closing 200ms linear;
    animation-fill-mode: forwards;
    animation-delay: 50ms;
    opacity: 0.85;
}

#permissions-modal-wrapper.closing .modal-wrapper {
    animation: permissions-modal-wrapper-closing 250ms cubic-bezier(0.19, 1, 0.22, 1);
    animation-fill-mode: forwards;
    opacity: 1;
    transform: scale(1);
}

#permissions-modal-wrapper .modal-wrapper {
    animation: permissions-modal-wrapper 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
    animation-fill-mode: forwards;
    transform: scale(0.7);
    transform-origin: 50% 50%;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    contain: content;
    justify-content: center;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    opacity: 0;
    pointer-events: none;
    position: absolute;
    user-select: none;
    z-index: 1000;
}

#permissions-modal-wrapper .modal-body {
    background-color: #36393f;
    width: auto;
    /*box-shadow: 0 0 0 1px rgba(32,34,37,.6), 0 2px 10px 0 rgba(0,0,0,.2);*/
    flex-direction: row;
    overflow: hidden;
    display: flex;
    flex: 1;
    contain: layout;
    position: relative;
}

#permissions-modal-wrapper #permissions-modal {
    display: flex;
    contain: layout;
    flex-direction: column;
    pointer-events: auto;
    border: 1px solid rgba(28,36,43,.6);
    border-radius: 5px;
    box-shadow: 0 2px 10px 0 rgba(0,0,0,.2);
    overflow: hidden;
    max-width: 1100px;
    min-width: 20%;
    max-height: 60%;
    height: 700px;
}

#permissions-modal-wrapper .header {
    background-color: #35393e;
    box-shadow: 0 2px 3px 0 rgba(0,0,0,.2);
    padding: 12px 20px;
    z-index: 1;
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    line-height: 19px;
}

.role-side {
    flex-direction: column;
    padding-left: 6px;
    padding-top: 6px;
}

.scroller {
    contain: layout;
    flex: 1;
    min-height: 1px;
    overflow-y: scroll;
}

#permissions-modal-wrapper .scroller-title {
    color: #fff;
    padding: 8px 0 4px 4px;
    margin-right: 8px;
    border-bottom: 1px solid rgba(0,0,0,0.3);
    display: none;
}

#permissions-modal-wrapper .role-side {
    width: 100%;
    min-width: 150px;
    background: #2f3136;
    flex: 0 0 auto;
    overflow: hidden;
    display: flex;
    height: 100%;
    min-height: 1px;
    position: relative;
}

#permissions-modal-wrapper .role-scroller {
    contain: layout;
    flex: 1;
    min-height: 1px;
    overflow-y: scroll;
    padding-top: 8px;
}

#permissions-modal-wrapper .role-item {
    display: flex;
    flex: 1 1 available;
    flex-direction: row;
    border-radius: 2px;
    padding: 6px;
    margin-bottom: 5px;
    cursor: pointer;
    color: #dcddde;
}

#permissions-modal-wrapper .role-item .channel {
    width: 30%;
    padding-right: 6px;
}

#permissions-modal-wrapper .role-item .topic {
    width: 70%;
}

#permissions-modal-wrapper .role-item:hover {
    background-color: rgba(0,0,0,0.1);
}

#permissions-modal-wrapper .role-item.selected {
    background-color: rgba(0,0,0,0.2);
}

.theme-light #permissions-modal-wrapper #permissions-modal {
    background: #fff;
}

.theme-light #permissions-modal-wrapper .modal-body {
    background: transparent;
}

.theme-light #permissions-modal-wrapper .header {
    background: transparent;
    color: #000;
}

.theme-light #permissions-modal-wrapper .role-side {
    background: rgba(0,0,0,.2);
}


.theme-light #permissions-modal-wrapper .role-item,
.theme-light #permissions-modal-wrapper .perm-name {
    color: #000;
}`;
      //</editor-fold>

      this.modalHTML = `<div id="permissions-modal-wrapper">
        <div class="callout-backdrop \${backdrop}"></div>
        <div class="modal-wrapper \${modal}">
            <div id="permissions-modal" class="\${inner}">
                <div class="header"><div class="title">\${header}</div></div>
                <div class="modal-body">
                    <div class="role-side">
                        <span class="scroller-title role-list-title">\${rolesLabel}</span>
                        <div class="scroller">
        
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
      this.modalButton = `<div class="role-item">
    <span class="channel">
        <div>\${channelName}</div>
    </span>
    <span class="topic">
        <div>\${topic}</div>
</span>
</div>`;

      this.contextMenuPatches = [];
    }

    onStart() {
      PluginUtilities.addStyle(this.getName(), this.css);

      this.modalHTML = Utilities.formatTString(this.modalHTML, DiscordClasses.Backdrop);
      this.modalHTML = Utilities.formatTString(this.modalHTML, DiscordClasses.Modals);

      this.patchGuildContextMenu();
    }

    onStop() {
      PluginUtilities.removeStyle(this.getName());
      this.unbindContextMenus();
      Logger.log("Stopped");
    }

    unbindContextMenus() {
      for (const cancel of this.contextMenuPatches) cancel();
    }

    patchGuildContextMenu() {
      const GuildContextMenu = WebpackModules.getModule(m => m.default && m.default.displayName == "GuildContextMenu");
      this.contextMenuPatches.push(Patcher.after(GuildContextMenu, "default", (_, [props], retVal) => {
        const original = retVal.props.children[0].props.children;
        const newOne = DCM.buildMenuItem({
          label: "Display Hidden Channels",
          action: () => {
            console.log(props.guild);
            this.showModal(this.createModalGuild(props.guild.id));
          }
        });
        if (Array.isArray(original)) {
          original.splice(1, 0, newOne);
        }
        else {
          retVal.props.children[0].props.children = [original, newOne];
        }
      }));
    }

    createModalGuild(serverId) {
      const myHeaders = new Headers();
      myHeaders.append("authorization", WebpackModules.getByProps("getSessionId").getToken());
      this.requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
      };
      this.getHiddenChannels(serverId).then(
        hiddenChannels => {
          this.showModal(this.createModal("Hidden Channels", hiddenChannels));
        }
      );
    }

    async getHiddenChannels(serverId) {
      let response = await fetch(`https://discord.com/api/v8/guilds/${serverId}/channels`, this.requestOptions);
      let allChannels = await response.json();
      const guild = DiscordAPI.Guild.fromId(serverId);
      const visibleChannelIds = guild.channels.map(channel => {
        return channel.discordObject.id;
      });
      return this.filterHiddenChannels(allChannels, visibleChannelIds);
    }

    showModal(modal) {
      const popout = document.querySelector(DiscordSelectors.UserPopout.userPopout);
      if (popout) popout.style.display = "none";
      const app = document.querySelector(".app-19_DXt");
      if (app) {
        app.append(modal);
      }
      else {
        document.querySelector("#app-mount").append(modal);
      }
    }

    createModal(title, channels) {
      const modal = DOMTools.parseHTML(Utilities.formatTString(this.modalHTML, {header: escapeHTML(title)}));
      modal.querySelector(".callout-backdrop").addEventListener("click", () => {
        modal.classList.add("closing");
        setTimeout(() => {
          modal.remove();
        }, 300);
      });

      for (const channelKey in channels) {
        console.log({channel: channels[channelKey]});
        const channelInfo = DOMTools.createElement(Utilities.formatTString(this.modalButton, {
          channelName: channels[channelKey].name,
          topic: channels[channelKey].topic ? channels[channelKey].topic : ""
        }));
        modal.querySelector(".scroller").append(channelInfo);
      }
      return modal;
    }


    filterHiddenChannels(allChannels, visibleChannels) {
      return allChannels.filter(channel => {
        return !visibleChannels.includes(channel.id);
      });
    }
  };
};
