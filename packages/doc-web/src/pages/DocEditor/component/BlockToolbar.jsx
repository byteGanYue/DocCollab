import React from 'react';
import ReactDOM from 'react-dom';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  FontSizeOutlined,
  FontColorsOutlined,
  BgColorsOutlined,
  AlignLeftOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  BlockOutlined,
  CodeOutlined,
  TableOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  ClearOutlined,
  FontSizeOutlined as FontIcon,
  FontColorsOutlined as ColorIcon,
  BgColorsOutlined as BgColorIcon,
  DownOutlined,
} from '@ant-design/icons';
import { Dropdown, Menu, Tooltip, Button } from 'antd';
import { TOOLBAR_CONFIG, TOOLBAR_TOOLTIPS } from '../../../../utils/index.js';

const BlockToolbar = ({
  visible,
  top,
  left,
  onFormat,
  expanded = false,
  onExpand,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!visible) return null;

  // 块级操作映射（作用于当前行）
  const BUTTONS = {
    bold: {
      icon: <BoldOutlined />,
      handler: () => onFormat('bold'),
    },
    italic: {
      icon: <ItalicOutlined />,
      handler: () => onFormat('italic'),
    },
    underline: {
      icon: <UnderlineOutlined />,
      handler: () => onFormat('underline'),
    },
    strike: {
      icon: <StrikethroughOutlined />,
      handler: () => onFormat('strike'),
    },
    link: {
      icon: <LinkOutlined />,
      handler: () => onFormat('link'),
    },
    blockquote: {
      icon: <BlockOutlined />,
      handler: () => onFormat('blockquote'),
    },
    'code-block': {
      icon: <CodeOutlined />,
      handler: () => onFormat('code-block'),
    },
    table: {
      icon: <TableOutlined />,
      handler: () => onFormat('table'),
    },
    image: {
      icon: <PictureOutlined />,
      handler: () => onFormat('image'),
    },
    video: {
      icon: <VideoCameraOutlined />,
      handler: () => onFormat('video'),
    },
    clean: {
      icon: <ClearOutlined />,
      handler: () => onFormat('clean'),
    },
  };

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 9999,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: 6,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        pointerEvents: 'auto',
        gap: 8,
        transition: 'box-shadow 0.2s',
      }}
      onMouseDown={e => e.preventDefault()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={onExpand}
        style={{
          ...btnStyle,
          background: expanded ? '#f0f0f0' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="插入新段落"
      >
        <BoldOutlined style={{ opacity: 0, pointerEvents: 'none' }} />
        <span
          style={{
            position: 'absolute',
            left: 6,
            top: -8,
            fontSize: 30,
            color: '#444343',
          }}
        >
          +
        </span>
      </button>
      {expanded &&
        TOOLBAR_CONFIG.flat().map((item, idx) => {
          if (typeof item === 'string') {
            const btn = BUTTONS[item];
            if (!btn) return null;
            return (
              <Tooltip title={TOOLBAR_TOOLTIPS[item] || item} key={item + idx}>
                <span
                  style={{ cursor: 'pointer', fontSize: 18 }}
                  onClick={btn.handler}
                >
                  {btn.icon}
                </span>
              </Tooltip>
            );
          } else if (typeof item === 'object') {
            if (item.font) {
              return (
                <Dropdown
                  key={'font' + idx}
                  overlay={
                    <Menu onClick={({ key }) => onFormat('font', key)}>
                      <Menu.Item key="sans-serif">默认</Menu.Item>
                      <Menu.Item key="serif">衬线</Menu.Item>
                      <Menu.Item key="monospace">等宽</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="字体">
                    <FontIcon style={{ fontSize: 18, cursor: 'pointer' }} />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.header) {
              return (
                <Dropdown
                  key={'header' + idx}
                  overlay={
                    <Menu
                      onClick={({ key }) => onFormat('header', Number(key))}
                    >
                      <Menu.Item key="1">H1</Menu.Item>
                      <Menu.Item key="2">H2</Menu.Item>
                      <Menu.Item key="3">H3</Menu.Item>
                      <Menu.Item key="4">H4</Menu.Item>
                      <Menu.Item key="5">H5</Menu.Item>
                      <Menu.Item key="6">H6</Menu.Item>
                      <Menu.Item key="0">正文</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="标题">
                    <FontSizeOutlined
                      style={{ fontSize: 18, cursor: 'pointer' }}
                    />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.size) {
              return (
                <Dropdown
                  key={'size' + idx}
                  overlay={
                    <Menu onClick={({ key }) => onFormat('size', key)}>
                      <Menu.Item key="small">小</Menu.Item>
                      <Menu.Item key="normal">正常</Menu.Item>
                      <Menu.Item key="large">大</Menu.Item>
                      <Menu.Item key="huge">特大</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="字号">
                    <FontSizeOutlined
                      style={{ fontSize: 18, cursor: 'pointer' }}
                    />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.color) {
              return (
                <Dropdown
                  key={'color' + idx}
                  overlay={
                    <Menu onClick={({ key }) => onFormat('color', key)}>
                      <Menu.Item key="#000000">黑色</Menu.Item>
                      <Menu.Item key="#e60000">红色</Menu.Item>
                      <Menu.Item key="#ff9900">橙色</Menu.Item>
                      <Menu.Item key="#ffff00">黄色</Menu.Item>
                      <Menu.Item key="#008a00">绿色</Menu.Item>
                      <Menu.Item key="#0066cc">蓝色</Menu.Item>
                      <Menu.Item key="#9933ff">紫色</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="文字颜色">
                    <ColorIcon style={{ fontSize: 18, cursor: 'pointer' }} />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.background) {
              return (
                <Dropdown
                  key={'background' + idx}
                  overlay={
                    <Menu onClick={({ key }) => onFormat('background', key)}>
                      <Menu.Item key="#ffffff">白色</Menu.Item>
                      <Menu.Item key="#f4cccc">浅红</Menu.Item>
                      <Menu.Item key="#fff2cc">浅黄</Menu.Item>
                      <Menu.Item key="#d9ead3">浅绿</Menu.Item>
                      <Menu.Item key="#cfe2f3">浅蓝</Menu.Item>
                      <Menu.Item key="#ead1dc">浅紫</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="背景色">
                    <BgColorIcon style={{ fontSize: 18, cursor: 'pointer' }} />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.align) {
              return (
                <Dropdown
                  key={'align' + idx}
                  overlay={
                    <Menu onClick={({ key }) => onFormat('align', key)}>
                      <Menu.Item key="left">左对齐</Menu.Item>
                      <Menu.Item key="center">居中</Menu.Item>
                      <Menu.Item key="right">右对齐</Menu.Item>
                      <Menu.Item key="justify">两端对齐</Menu.Item>
                    </Menu>
                  }
                >
                  <Tooltip title="对齐方式">
                    <AlignLeftOutlined
                      style={{ fontSize: 18, cursor: 'pointer' }}
                    />
                  </Tooltip>
                </Dropdown>
              );
            }
            if (item.list) {
              return item.list === 'ordered' ? (
                <Tooltip title="有序列表" key={'list-ordered' + idx}>
                  <OrderedListOutlined
                    onClick={() => onFormat('list', 'ordered')}
                    style={{ fontSize: 18, cursor: 'pointer' }}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="无序列表" key={'list-bullet' + idx}>
                  <UnorderedListOutlined
                    onClick={() => onFormat('list', 'bullet')}
                    style={{ fontSize: 18, cursor: 'pointer' }}
                  />
                </Tooltip>
              );
            }
            if (item.indent) {
              return item.indent === '+1' ? (
                <Tooltip title="增加缩进" key={'indent+1' + idx}>
                  <Button
                    size="small"
                    shape="circle"
                    icon={<DownOutlined />}
                    onClick={() => onFormat('indent', '+1')}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="减少缩进" key={'indent-1' + idx}>
                  <Button
                    size="small"
                    shape="circle"
                    icon={<DownOutlined />}
                    onClick={() => onFormat('indent', '-1')}
                  />
                </Tooltip>
              );
            }
            return null;
          }
          return null;
        })}
    </div>,
    document.body,
  );
};

const btnStyle = {
  width: 32,
  height: 32,
  border: 'none',
  background: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  transition: 'background 0.2s',
  position: 'relative',
};

export default BlockToolbar;
