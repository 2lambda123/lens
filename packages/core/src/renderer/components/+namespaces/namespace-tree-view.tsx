/**
 * Copyright (c) OpenLens Authors. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
import { SvgIcon, withStyles } from "@material-ui/core";
import type { TreeItemProps } from "@material-ui/lab";
import { TreeItem, TreeView } from "@material-ui/lab";
import { withInjectables } from "@ogre-tools/injectable-react";
import React from "react";
import { Link } from "react-router-dom";
import type { Namespace } from "../../../common/k8s-api/endpoints";
import { DrawerTitle } from "../drawer";
import type { GetDetailsUrl } from "../kube-detail-params/get-details-url.injectable";
import getDetailsUrlInjectable from "../kube-detail-params/get-details-url.injectable";
import type { NamespaceStore } from "./store";
import namespaceStoreInjectable from "./store.injectable";
import { SubnamespaceBadge } from "./subnamespace-badge";

interface NamespaceTreeViewProps {
  root: Namespace;
}

interface Dependencies {
  namespaceStore: NamespaceStore;
  getDetailsUrl: GetDetailsUrl;
}

function isNamespaceControlledByHNC(namespace: Namespace) {
  const hierarchicalNamesaceControllerLabel = "hnc.x-k8s.io/included-namespace=true";

  return namespace.getLabels().find(label => label === hierarchicalNamesaceControllerLabel);
}

function NonInjectableNamespaceTreeView({ root, namespaceStore, getDetailsUrl }: Dependencies & NamespaceTreeViewProps) {
  const hierarchicalNamespaces = namespaceStore.getByLabel(["hnc.x-k8s.io/included-namespace=true"]);
  const [expandedItems, setExpandedItems] = React.useState<string[]>(hierarchicalNamespaces.map(ns => `namespace-${ns.getId()}`));

  function renderChildren(parent: Namespace) {
    const children = hierarchicalNamespaces.filter(ns =>
      ns.getLabels().find(label => label === `${parent.getName()}.tree.hnc.x-k8s.io/depth=1`),
    );

    return children.map(child => (
      <StyledTreeItem
        key={`namespace-${child.getId()}`}
        nodeId={`namespace-${child.getId()}`}
        data-testid={`namespace-${child.getId()}`}
        onIconClick={(evt) =>{
          toggleNode(`namespace-${child.getId()}`);
          evt.stopPropagation();
        }}
        label={(
          <>
            <Link key={child.getId()} to={getDetailsUrl(child.selfLink)}>
              {child.getName()}
            </Link>
            {" "}
            <SubnamespaceBadge
              id={`namespace-details-badge-for-${child.getId()}`}
              namespace={child}
            />
          </>
        )}
      >
        {renderChildren(child)}
      </StyledTreeItem>
    ));
  }

  function toggleNode(id: string) {
    if (expandedItems.includes(id)) {
      setExpandedItems(expandedItems.filter(item => item !== id));
    } else {
      setExpandedItems([...expandedItems, id]);
    }
  }

  if (!isNamespaceControlledByHNC(root)) {
    return null;
  }

  return (
    <div data-testid="namespace-tree-view">
      <DrawerTitle>Tree View</DrawerTitle>
      <TreeView
        defaultExpanded={[`namespace-${root.getId()}`]}
        defaultCollapseIcon={<MinusSquare />}
        defaultExpandIcon={<PlusSquare />}
        defaultEndIcon={(<div style={{ opacity: 0.3 }}><MinusSquare /></div>)}
        expanded={expandedItems}
      >
        <StyledTreeItem
          nodeId={`namespace-${root.getId()}`}
          label={root.getName()}
          data-testid={`namespace-${root.getId()}`}
          onIconClick={(evt) => {
            toggleNode(`namespace-${root.getId()}`);
            evt.stopPropagation();
          }}
        >
          {renderChildren(root)}
        </StyledTreeItem>
      </TreeView>
    </div>
  );
}

function MinusSquare() {
  return (
    <SvgIcon style={{ width: 14, height: 14 }} data-testid="minus-square">
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 11.023h-11.826q-.375 0-.669.281t-.294.682v0q0 .401.294 .682t.669.281h11.826q.375 0 .669-.281t.294-.682v0q0-.401-.294-.682t-.669-.281z" />
    </SvgIcon>
  );
}

function PlusSquare() {
  return (
    <SvgIcon style={{ width: 14, height: 14 }} data-testid="plus-square">
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 12.977h-4.923v4.896q0 .401-.281.682t-.682.281v0q-.375 0-.669-.281t-.294-.682v-4.896h-4.923q-.401 0-.682-.294t-.281-.669v0q0-.401.281-.682t.682-.281h4.923v-4.896q0-.401.294-.682t.669-.281v0q.401 0 .682.281t.281.682v4.896h4.923q.401 0 .682.281t.281.682v0q0 .375-.281.669t-.682.294z" />
    </SvgIcon>
  );
}

const StyledTreeItem = withStyles(() => ({
  group: {
    marginLeft: 8,
    paddingLeft: 16,
    borderLeft: `1px dashed var(--borderColor)`,
  },
  label: {
    fontSize: "inherit",
    lineHeight: "1.8",
    cursor: "default",
    backgroundColor: "transparent!important",
  },
}))((props: TreeItemProps) => <TreeItem {...props} />);

export const NamespaceTreeView = withInjectables<Dependencies, NamespaceTreeViewProps>(NonInjectableNamespaceTreeView, {
  getProps: (di, props) => ({
    namespaceStore: di.inject(namespaceStoreInjectable),
    getDetailsUrl: di.inject(getDetailsUrlInjectable),
    ...props,
  }),
});
