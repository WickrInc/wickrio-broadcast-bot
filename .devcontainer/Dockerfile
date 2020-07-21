FROM wickr/bot-cloud-alpha:5.59.02.02

LABEL maintainer="wickr <info@wickr.com>"
# Variables
# ENV HOME /home/ubuntu

WORKDIR $HOME


# # Authorize SSH Host
# ARG SSH_KEY
# ENV SSH_KEY=$SSH_KEY

# # Make ssh dir
# RUN mkdir /root/.ssh/
# RUN touch /root/.ssh/id_rsa

# # # Create id_rsa from string arg, and set permissions
# RUN echo "$SSH_KEY" > /root/.ssh/id_rsa
# # RUN chmod 600 /root/.ssh/id_rsa

# # Create known_hosts
# RUN touch /root/.ssh/known_hosts

# # Add git providers to known_hosts
# RUN ssh-keyscan bitbucket.org >> /root/.ssh/known_hosts
# RUN ssh-keyscan github.com >> /root/.ssh/known_hosts
# RUN ssh-keyscan gitlab.com >> /root/.ssh/known_hosts



ARG USERNAME=ubuntu
ARG USER_UID=1000
ARG USER_GID=$USER_UID
ENV NVM_DIR=/usr/local/nvm

# Create the user
# RUN groupadd --gid $USER_GID $USERNAME \
#   && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
#   #
#   # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
#   && apt-get update \
#   && apt-get install -y sudo \
#   && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
#   && chmod 0440 /etc/sudoers.d/$USERNAME



# ********************************************************
# * Anything else you want to do like clean up goes here *
# ********************************************************

# [Optional] Set the default user. Omit if you want to keep the default as root.
# USER $USERNAME
# COPY integrations /usr/lib/wickr/integrations/software
ARG DEBIAN_FRONTEND=noninteractive
RUN mkdir /usr/local/wickr/WickrIO 
# COPY clientConfig.json /usr/local/wickr/WickrIO/
# \
# && cp clientConfig.json /usr/local/wickr/WickrIO/
ENV LANG en_US.utf8
ENV HOME /home/ubuntu
ARG DEBIAN_FRONTEND=readline
# Install Dev environment
RUN  apt-get update && apt-get -y install curl zsh git 
RUN zsh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" ||true

# RUN ln -f /bin/zsh /bin/sh

ENV PATH=${PATH}:/usr/local/share/npm-global/bin

RUN  apt-get update \
  &&  apt-get install software-properties-common -y \
  && echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections \ 
  && apt-get install -y -q \ 
  &&  apt-get install fonts-powerline -y \
  #  
  &&  apt-get update \
  # 
  &&  apt install fonts-firacode -y  \ 
  && apt-get -y install software-properties-common 
# && curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add - 2>/dev/null \
# && add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu bionic stable" \
# && apt-get update -y \
# && apt-get install -y docker-ce-cli \
# && apt-get install -y python python-pip \
# && pip install docker-compose \

# RUN curl -sSf sh.rustup.rs | sh -s -- -y \
#   && echo "export PATH=~/.cargo/bin:$PATH" >> ~/.zshrc \
#   && cargo install starship
# Update default packages

RUN apt-get update

# Get Ubuntu packages
RUN apt-get install -y \
  build-essential \
  curl

# Update new packages
RUN apt-get update

# Get Rust
ENV RUSTUP_HOME=/usr/local/rustup \
  CARGO_HOME=/usr/local/cargo \
  PATH=/usr/local/cargo/bin:$PATH

RUN set -eux; \
  apt-get update; \
  apt-get install -y --no-install-recommends \
  ca-certificates \
  gcc \
  libc6-dev \
  wget \
  ; \
  \
  url="https://static.rust-lang.org/rustup/dist/x86_64-unknown-linux-gnu/rustup-init"; \
  wget "$url"; \
  chmod +x rustup-init; \
  ./rustup-init -y --no-modify-path --default-toolchain nightly; \
  rm rustup-init; \
  chmod -R a+w $RUSTUP_HOME $CARGO_HOME; \
  rustup --version; \
  cargo --version; \
  rustc --version; \
  \
  apt-get remove -y --auto-remove \
  wget \
  ; \
  rm -rf /var/lib/apt/lists/* 

RUN apt-get update \ 
  && apt install pkg-config libssl-dev wget -y
RUN apt-get install ca-certificates gcc  libc6-dev -y

RUN cargo install starship
RUN echo 'eval "$(starship init zsh)"' >> /home/ubuntu/.zshrc
RUN echo 'eval "$(ssh-agent -s)"' >> /home/ubuntu/.zshrc
RUN echo '. /usr/local/nvm/nvm.sh' >> /home/ubuntu/.zshrc
# RUN echo '[[ -s $HOME/.nvm/nvm.sh ]] && . $HOME/.nvm/nvm.sh' >> /home/ubuntu/.zshrc



# ENTRYPOINT ["zsh"]
# SHELL ["/bin/zsh", "-c"]


# Start the processes
CMD "/home/ubuntu/start.sh"

ENV DEBIAN_FRONTEND=dialog